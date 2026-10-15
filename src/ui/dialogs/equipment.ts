import { gateways } from "../../gateways/registry";
import { matchesEquipmentSelection } from "../../entities/equipment";
import { addEquipment } from "../../interactors/library/add-equipment";
import { equipmentOptions } from "../../services/exercise-catalog";
import { present } from "../presenter";
import { escapeHtml } from "../html";
import { dialogById, formById, formField } from "../dom";


export function renderEquipmentCatalogDialog() {
  const list = document.getElementById("equipment-catalog-list");
  if (!list) return;
  const catalog = equipmentOptions();
  list.innerHTML = `
    <div class="equipment-catalog-summary"><strong>${catalog.length}</strong> equipment types in your master list</div>
    <div class="equipment-catalog-pills">
      ${catalog
        .map((equipment) => {
          const useCount = gateways.exercises.all().filter((exercise) =>
            matchesEquipmentSelection(exercise, equipment),
          ).length;
          return `<span><strong>${escapeHtml(equipment)}</strong><small>${useCount} exercise${useCount === 1 ? "" : "s"}</small></span>`;
        })
        .join("")}
    </div>`;
}


export function openEquipmentDialog() {
  const form = formById("equipment-form");
  form.reset();
  renderEquipmentCatalogDialog();
  dialogById("equipment-dialog").showModal();
  setTimeout(() => formField(form, "equipmentName").focus(), 0);
}


export function saveEquipmentForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const result = addEquipment(gateways, {
    name: String(data.get("equipmentName") || ""),
  });
  if (result.changed) form.reset();
  present(result);
  if (result.changed || result.toast) formField(form, "equipmentName").focus();
}
