const fs = require("fs");
const path = require("path");

// Lire l'ABI JSON généré par Forge
const abiPath = path.join(__dirname, "../abi/RiseFiVault.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// Générer le code TypeScript
const tsCode = `// Auto-generated ABI from RiseFiVault.sol
// DO NOT EDIT MANUALLY - Run 'npm run generate-abi' to update

export const RISEFI_VAULT_ABI = ${JSON.stringify(abi, null, 2)} as const;

// Type-safe ABI for better TypeScript support
export type RiseFiVaultABI = typeof RISEFI_VAULT_ABI;
`;

// Écrire le fichier TypeScript
const outputPath = path.join(__dirname, "../utils/generated-abi.ts");
fs.writeFileSync(outputPath, tsCode);

console.log("✅ ABI TypeScript généré avec succès dans:", outputPath);
console.log(
  "📊 Fonctions trouvées:",
  abi.filter((item) => item.type === "function").length
);
console.log(
  "📡 Événements trouvés:",
  abi.filter((item) => item.type === "event").length
);
console.log(
  "❌ Erreurs trouvées:",
  abi.filter((item) => item.type === "error").length
);
