const OBJECTIF_SEMAINE = 36.75;

const jours = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
];

let anneeActive = new Date().getFullYear();
let semaineActive = getNumeroSemaineISO(new Date());

const anneeSelect = document.getElementById("anneeSelect");
const semaineSelect = document.getElementById("semaineSelect");
const periodeSemaine = document.getElementById("periodeSemaine");
const joursContainer = document.getElementById("joursContainer");

function init() {
  remplirAnnees();
  remplirSemaines();
  chargerSoldeDepart();
  chargerSemaine();
}

function remplirAnnees() {
  for (let annee = anneeActive - 2; annee <= anneeActive + 2; annee++) {
    const option = document.createElement("option");
    option.value = annee;
    option.textContent = annee;
    anneeSelect.appendChild(option);
  }

  anneeSelect.value = anneeActive;
}

function remplirSemaines() {
  for (let i = 1; i <= 52; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Semaine ${i}`;
    semaineSelect.appendChild(option);
  }

  semaineSelect.value = semaineActive;
}

function changerAnnee() {
  anneeActive = Number(anneeSelect.value);
  chargerSemaine();
}

function changerSemaineDirect() {
  semaineActive = Number(semaineSelect.value);
  chargerSemaine();
}

function changerSemaine(direction) {
  semaineActive += direction;

  if (semaineActive < 1) {
    semaineActive = 52;
    anneeActive--;
  }

  if (semaineActive > 52) {
    semaineActive = 1;
    anneeActive++;
  }

  anneeSelect.value = anneeActive;
  semaineSelect.value = semaineActive;

  chargerSemaine();
}

function getCleStockage() {
  return `horaires_${anneeActive}_S${semaineActive}`;
}

function creerSemaineVide() {
  return jours.map(jour => ({
    jour,
    embauche: "",
    departCoupure: "",
    retourCoupure: "",
    debauche: ""
  }));
}

function chargerSemaine() {
  const sauvegarde = localStorage.getItem(getCleStockage());
  const donnees = sauvegarde ? JSON.parse(sauvegarde) : creerSemaineVide();

  afficherPeriode();
  afficherJours(donnees);
  calculerResume();
}

function sauvegarderSemaine() {
  const donnees = lireDonneesEcran();
  localStorage.setItem(getCleStockage(), JSON.stringify(donnees));
  calculerResume();
}

function afficherJours(donnees) {
  joursContainer.innerHTML = "";

  donnees.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "jour-card";

    card.innerHTML = `
      <h2>${item.jour}</h2>

      <div class="grid">
        ${creerSelectHeure(index, "embauche", "Embauche", item.embauche)}
        ${creerSelectHeure(index, "departCoupure", "Départ coupure", item.departCoupure)}
        ${creerSelectHeure(index, "retourCoupure", "Retour coupure", item.retourCoupure)}
        ${creerSelectHeure(index, "debauche", "Débauche", item.debauche)}
      </div>

      <div class="total-jour" id="totalJour-${index}">
        Total : 0,00 h
      </div>
    `;

    joursContainer.appendChild(card);
  });
}

function creerSelectHeure(index, champ, label, valeur) {
  let options = `<option value="">--</option>`;

  for (let h = 0; h <= 23.75; h += 0.25) {
    const val = Number(h.toFixed(2));
    const selected = Number(valeur) === val ? "selected" : "";
    options += `<option value="${val}" ${selected}>${formatDecimal(val)} — ${formatHeure(val)}</option>`;
  }

  return `
    <div>
      <label>${label}</label>
      <select data-index="${index}" data-champ="${champ}" onchange="sauvegarderSemaine()">
        ${options}
      </select>
    </div>
  `;
}

function lireDonneesEcran() {
  const donnees = creerSemaineVide();
  const selects = document.querySelectorAll("#joursContainer select");

  selects.forEach(select => {
    const index = Number(select.dataset.index);
    const champ = select.dataset.champ;
    donnees[index][champ] = select.value === "" ? "" : Number(select.value);
  });

  return donnees;
}

function calculerJour(jour) {
  if (
    jour.embauche === "" ||
    jour.departCoupure === "" ||
    jour.retourCoupure === "" ||
    jour.debauche === ""
  ) {
    return 0;
  }

  const matin = jour.departCoupure - jour.embauche;
  const apresMidi = jour.debauche - jour.retourCoupure;
  const total = matin + apresMidi;

  return total > 0 ? total : 0;
}

function calculerResume() {
  const donnees = lireDonneesEcran();
  let total = 0;

  donnees.forEach((jour, index) => {
    const totalJour = calculerJour(jour);
    total += totalJour;

    const element = document.getElementById(`totalJour-${index}`);
    if (element) {
      element.textContent = `Total : ${formatDecimal(totalJour)} h`;
    }
  });

  const heuresSupp = Math.max(total - OBJECTIF_SEMAINE, 0);
  const compteurValorise = heuresSupp * 1.25;

  document.getElementById("totalSemaine").textContent = `${formatDecimal(total)} h`;
  document.getElementById("heuresSupp").textContent = `${formatDecimal(heuresSupp)} h`;
  document.getElementById("compteurValorise").textContent = `${formatDecimal(compteurValorise)} h`;
}
document.getElementById("compteurTotal").textContent = `${formatDecimal(compteurTotal)} h`;
function copierSemainePrecedente() {
  let semainePrecedente = semaineActive - 1;
  let anneePrecedente = anneeActive;

  if (semainePrecedente < 1) {
    semainePrecedente = 52;
    anneePrecedente--;
  }

  const clePrecedente = `horaires_${anneePrecedente}_S${semainePrecedente}`;
  const sauvegarde = localStorage.getItem(clePrecedente);

  if (!sauvegarde) {
    alert("Aucune donnée trouvée pour la semaine précédente.");
    return;
  }

  localStorage.setItem(getCleStockage(), sauvegarde);
  chargerSemaine();
  alert("Semaine précédente copiée.");
}

function resetSemaine() {
  if (!confirm("Effacer toute la semaine ?")) return;

  localStorage.removeItem(getCleStockage());
  chargerSemaine();
}

function exporterCSV() {
  const donnees = lireDonneesEcran();

  let csv = "Année;Semaine;Jour;Embauche;Départ coupure;Retour coupure;Débauche;Total jour\n";

  let total = 0;

  donnees.forEach(jour => {
    const totalJour = calculerJour(jour);
    total += totalJour;

    csv += `${anneeActive};${semaineActive};${jour.jour};`;
    csv += `${formatDecimalExport(jour.embauche)};`;
    csv += `${formatDecimalExport(jour.departCoupure)};`;
    csv += `${formatDecimalExport(jour.retourCoupure)};`;
    csv += `${formatDecimalExport(jour.debauche)};`;
    csv += `${formatDecimal(totalJour)}\n`;
  });

  const heuresSupp = Math.max(total - OBJECTIF_SEMAINE, 0);
  const compteurValorise = heuresSupp * 1.25;
const soldeDepartInput = document.getElementById("soldeDepart");
const soldeDepart = soldeDepartInput && soldeDepartInput.value !== ""
  ? Number(soldeDepartInput.value)
  : 0;

const compteurTotal = soldeDepart + compteurValorise;
  csv += `\n;;;;;;Objectif semaine;${formatDecimal(OBJECTIF_SEMAINE)}\n`;
  csv += `;;;;;;Total semaine;${formatDecimal(total)}\n`;
  csv += `;;;;;;Heures supplémentaires;${formatDecimal(heuresSupp)}\n`;
  csv += `;;;;;;Compteur valorisé +25%;${formatDecimal(compteurValorise)}\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const lien = document.createElement("a");
  const url = URL.createObjectURL(blob);

  lien.href = url;
  lien.download = `horaires_semaine_${semaineActive}_${anneeActive}.csv`;
  lien.click();

  URL.revokeObjectURL(url);
}

function afficherPeriode() {
  const lundi = getDateOfISOWeek(semaineActive, anneeActive);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  periodeSemaine.textContent = `Du ${formatDate(lundi)} au ${formatDate(dimanche)}`;
}

function getDateOfISOWeek(semaine, annee) {
  const simple = new Date(annee, 0, 1 + (semaine - 1) * 7);
  const jourSemaine = simple.getDay();
  const isoWeekStart = new Date(simple);

  if (jourSemaine <= 4) {
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  return isoWeekStart;
}

function getNumeroSemaineISO(date) {
  const copie = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jour = copie.getUTCDay() || 7;
  copie.setUTCDate(copie.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(copie.getUTCFullYear(), 0, 1));
  return Math.ceil((((copie - debutAnnee) / 86400000) + 1) / 7);
}

function formatDate(date) {
  return date.toLocaleDateString("fr-FR");
}

function formatDecimal(valeur) {
  if (valeur === "" || valeur === null || valeur === undefined) return "";
  return Number(valeur).toFixed(2).replace(".", ",");
}

function formatDecimalExport(valeur) {
  if (valeur === "" || valeur === null || valeur === undefined) return "";
  return formatDecimal(valeur);
}

function formatHeure(decimal) {
  const heures = Math.floor(decimal);
  const minutes = Math.round((decimal - heures) * 60);
  return `${heures}h${minutes.toString().padStart(2, "0")}`;
}

init();
function getCleSoldeDepart() {
  return "solde_depart_compteur_majore";
}

function chargerSoldeDepart() {
  const solde = localStorage.getItem(getCleSoldeDepart());
  const input = document.getElementById("soldeDepart");

  if (input) {
    input.value = solde ? solde : "";
  }
}

function sauvegarderSoldeDepart() {
  const input = document.getElementById("soldeDepart");
  const valeur = input.value === "" ? 0 : Number(input.value);

  localStorage.setItem(getCleSoldeDepart(), valeur);
  calculerResume();
}
