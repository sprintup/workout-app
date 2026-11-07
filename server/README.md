# Keeping your data in a database on DreamHost

The app is plain HTML, CSS and JavaScript, so it can't talk to MySQL itself. `data.php` sits between them: the app sends your save file to it over HTTPS, and it keeps it as the one row in the `workout_data` table. Each Save replaces that row, so there is only ever one copy of your data.

Nothing about your database is stored on the server or in the app's code. You enter the address of `data.php`, the database host and name, and the database username and password in the app's **Connect database** window. The app sends them with each request over HTTPS, and MySQL checks the login. `data.php` refuses hosts that resolve to private or reserved addresses, so it can't be pointed at the web server itself or a private network.

The database is optional. Without it, the app saves to a JSON file as before.

## Setup

1. **Create the database.** In the DreamHost panel, open **MySQL Databases** and create a database and a user. Save the username and password in your password manager.
2. **Note the host and name.** The host is one of the hostnames listed for your MySQL server (DreamHost databases don't use `localhost`); the name is the database's name. Save both in your password manager with the login; you enter them when you connect.
3. **Turn on HTTPS** for the domain you'll use. The free Let's Encrypt certificate is fine. The address must be `https://`, because the password travels with every request.
4. **Upload `data.php`** to the site's web folder, for example `~/example.com/data.php`. Its address, `https://example.com/data.php`, is what you enter in the app's sign-in form; save it in your password manager with the login.

The `workout_data` table is created on the first connection.

## Using it

Press **Connect database** and enter the address of `data.php` and the database login (or just press **Load** or **Save**, which ask you to sign in). Then:

- **Load** gets the data from the database. If that would change what's in this browser, the app asks first, and Cancel leaves everything as it was.
- **Save** replaces the copy in the database with this browser's data. Each save says which version it is replacing. If the database changed since this browser loaded it (another device saved), or it holds data this browser never loaded, the app asks first, and Cancel overwrites nothing.
- **Import** and **Export** work with a JSON file on this computer. To move a local file into the database, Import it, then Save.

After a successful sign-in, this browser remembers the address, host, database name and username so next time you only enter the password; **Forget saved details** in the same window clears them. The password is never stored by the app, so you sign in again after a reload. Your changes are still kept in the browser after every change, as before.

## Safety net

There is one copy, so a mistaken Save replaces it. DreamHost keeps its own automatic backups of MySQL databases: **Restore DB** on the MySQL Databases page brings back an earlier state.

## If something goes wrong

| Message in the app | Likely cause |
|---|---|
| The database address could not be reached | A typo in the address, `data.php` not uploaded, HTTPS not working, the address redirects (use the exact final address, with or without `www`), or the host's firewall blocked the request |
| The database username or password was not accepted | A typo in the login, or the user hasn't been given access to the database |
| The database host could not be found / is not allowed | A typo in the host, or a hostname that isn't resolving yet (new DreamHost hostnames can take a few hours) |
| The server could not reach its database | The host or database name is wrong; the reason is in the site's PHP error log |

Saves are sent as base64 because DreamHost's firewall (mod_security) rejects JSON bodies with more than about a thousand fields. `data.php` decodes them, so the table holds plain JSON.
