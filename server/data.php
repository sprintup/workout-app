<?php
// Keeps the one copy of your Basement 45 data in MySQL. See server/README.md.
//
//   GET  data.php   your data: {revision, updatedAt, contents}, or revision 0
//                   and null contents when nothing has been saved yet
//   POST data.php   replaces your data with the request body. The body is the
//                   save file in base64, because the web host's firewall
//                   rejects JSON with thousands of fields. X-Base-Revision
//                   says which revision the app last saw; if the stored data
//                   has moved on since (another device saved), nothing is
//                   overwritten and the answer is 409.
//
// Nothing about your database is stored here. Every request except the CORS
// preflight carries the database host, name and login in the X-Db-Host,
// X-Db-Name, X-Db-User and X-Db-Password headers, typed into the app (or
// filled in by the browser), and MySQL checks the login. Requests never use cookies, so allowing any origin only lets a page
// try; without the login it gets nothing. The app may run from file://, whose
// origin is "null", which is why this isn't limited to a single site.
declare(strict_types=1);

ini_set('display_errors', '0');

const MAX_DATA_BYTES = 10 * 1024 * 1024;
const MYSQL_ACCESS_DENIED = [1044, 1045];
const ROW_ID = 1;

function respond(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

function isoTime(?string $utcDateTime): ?string
{
    return $utcDateTime === null ? null : str_replace(' ', 'T', $utcDateTime) . 'Z';
}

/** The stored row, or null when nothing has been saved yet. */
function storedRow(PDO $database): ?array
{
    $select = $database->prepare(
        'SELECT revision, updated_at, payload FROM workout_data WHERE id = ?',
    );
    $select->execute([ROW_ID]);
    $row = $select->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Db-Host, X-Db-Name, X-Db-User, X-Db-Password, X-Base-Revision');
header('Access-Control-Max-Age: 600');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = trim((string) ($_SERVER['HTTP_X_DB_HOST'] ?? ''));
$name = trim((string) ($_SERVER['HTTP_X_DB_NAME'] ?? ''));
$user = (string) ($_SERVER['HTTP_X_DB_USER'] ?? '');
$password = (string) ($_SERVER['HTTP_X_DB_PASSWORD'] ?? '');
if ($host === '' || $name === '' || $user === '' || $password === '') {
    respond(401, ['error' => 'Enter your database host, name, username and password.']);
}
// A plain hostname (no port, no DSN options) and a plain database name.
if (!preg_match('/^[A-Za-z0-9.-]{1,253}$/', $host)
    || !preg_match('/^[A-Za-z0-9_$-]{1,64}$/', $name)) {
    respond(400, ['error' => 'That database host or name is not valid.']);
}
// The host comes from the request, so keep this script from being pointed at
// the web server itself or a private network.
$addresses = gethostbynamel($host);
if (!$addresses) {
    respond(400, ['error' => 'The database host could not be found.']);
}
foreach ($addresses as $address) {
    $public = filter_var(
        $address,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
    );
    if ($public === false) {
        respond(400, ['error' => 'That database host is not allowed.']);
    }
}

try {
    try {
        $database = new PDO(
            sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $name),
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5,
            ],
        );
    } catch (PDOException $error) {
        $denied = in_array((int) $error->getCode(), MYSQL_ACCESS_DENIED, true)
            || preg_match('/\[(1044|1045)\]/', $error->getMessage()) === 1;
        if ($denied) {
            sleep(1); // slows down guessing
            respond(401, ['error' => 'The database username or password was not accepted.']);
        }
        throw $error;
    }
    $database->exec(
        'CREATE TABLE IF NOT EXISTS workout_data (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            revision INT UNSIGNED NOT NULL,
            updated_at DATETIME NOT NULL,
            payload MEDIUMTEXT NOT NULL
        ) DEFAULT CHARSET=utf8mb4',
    );

    if ($method === 'GET') {
        $row = storedRow($database);
        respond(200, [
            'revision' => $row ? (int) $row['revision'] : 0,
            'updatedAt' => isoTime($row['updated_at'] ?? null),
            'contents' => $row['payload'] ?? null,
        ]);
    }

    if ($method !== 'POST') {
        respond(405, ['error' => 'Only GET and POST are supported.']);
    }

    $encoded = (string) file_get_contents('php://input');
    if (strlen($encoded) > intdiv(MAX_DATA_BYTES * 4, 3) + 4) {
        respond(413, ['error' => 'Your data is too large to save.']);
    }
    $payload = base64_decode(trim($encoded), true);
    $parsed = $payload === false ? null : json_decode($payload, true);
    if (!is_array($parsed) || !isset($parsed['appState'])) {
        respond(400, ['error' => 'This is not a Basement 45 save file.']);
    }
    $baseRevision = $_SERVER['HTTP_X_BASE_REVISION'] ?? '';
    if (!ctype_digit((string) $baseRevision)) {
        respond(400, ['error' => 'The app did not say which revision it is replacing.']);
    }
    $baseRevision = (int) $baseRevision;
    $updatedAt = gmdate('Y-m-d H:i:s');

    if ($baseRevision === 0) {
        try {
            $database->prepare(
                'INSERT INTO workout_data (id, revision, updated_at, payload) VALUES (?, 1, ?, ?)',
            )->execute([ROW_ID, $updatedAt, $payload]);
            $saved = true;
        } catch (PDOException $error) {
            if ($error->getCode() !== '23000') throw $error; // the row exists
            $saved = false;
        }
    } else {
        $update = $database->prepare(
            'UPDATE workout_data SET revision = revision + 1, updated_at = ?, payload = ?
             WHERE id = ? AND revision = ?',
        );
        $update->execute([$updatedAt, $payload, ROW_ID, $baseRevision]);
        $saved = $update->rowCount() === 1;
    }

    $row = storedRow($database);
    if (!$saved) {
        respond(409, [
            'error' => 'Your data in the database changed since this browser last loaded it.',
            'revision' => $row ? (int) $row['revision'] : 0,
            'updatedAt' => isoTime($row['updated_at'] ?? null),
        ]);
    }
    respond(200, [
        'revision' => (int) $row['revision'],
        'updatedAt' => isoTime($row['updated_at']),
    ]);
} catch (Throwable $error) {
    // The details can name the database, so they stay in the server log.
    error_log('data.php: ' . $error->getMessage());
    respond(500, ['error' => 'The server could not reach its database.']);
}
