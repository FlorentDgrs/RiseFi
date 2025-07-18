# 🔄 Frontend Updates - RiseFi Vault Integration

## 📋 Changements Effectués

### ✅ 1. ABI Mis à Jour

- **Problème**: L'ABI du frontend était obsolète et ne correspondait pas au contrat actuel
- **Solution**:
  - Généré automatiquement l'ABI depuis le contrat compilé
  - Créé un script `generate-abi.js` pour automatiser le processus
  - Ajouté les commandes npm `generate-abi` et `build-contracts`

### ✅ 2. Fonction withdraw() Remplacée

- **Problème**: Le frontend utilisait `withdraw()` qui est désactivée dans le contrat
- **Solution**:
  - Remplacé tous les appels `withdraw()` par `redeem()`
  - Mis à jour `ActionCard.tsx` et `WithdrawCard.tsx`
  - Modifié `useVaultUserStats.ts` pour utiliser `maxRedeem` au lieu de `maxWithdraw`

### ✅ 3. Nouvelles Fonctionnalités Ajoutées

- **EmergencyWithdraw**: Nouveau composant pour la fonction d'urgence
- **VaultInfo**: Composant pour afficher les constantes du contrat
- **Nouvelles constantes**: MIN_DEPOSIT, DEAD_SHARES, SLIPPAGE_TOLERANCE, etc.

### ✅ 4. Gestion des Erreurs Améliorée

- **Nouvelles erreurs custom**: InsufficientDeposit, SlippageExceeded, etc.
- **Meilleure gestion des états**: pause/unpause, emergency modes
- **Validation renforcée**: Slippage protection, liquidity checks

## 🔧 Nouveaux Scripts NPM

```bash
# Générer l'ABI TypeScript depuis le contrat compilé
npm run generate-abi

# Compiler les contrats et générer l'ABI
npm run build-contracts
```

## 📊 Nouvelles Fonctions Disponibles

### Lecture (Read Functions)

- `MIN_DEPOSIT()` - Montant minimum de dépôt
- `DEAD_SHARES()` - Nombre de shares mortes
- `SLIPPAGE_TOLERANCE()` - Tolérance de slippage
- `BASIS_POINTS()` - Points de base pour calculs
- `getSlippageTolerance()` - Obtenir la tolérance de slippage
- `isSlippageAcceptable(expected, actual)` - Vérifier si le slippage est acceptable
- `isPaused()` - Vérifier si le contrat est en pause
- `DEAD_ADDRESS()` - Adresse des shares mortes
- `morphoVault()` - Adresse du vault Morpho sous-jacent

### Écriture (Write Functions)

- `emergencyWithdraw(shares, receiver)` - Retrait d'urgence
- `pause()` - Mettre en pause (owner only)
- `unpause()` - Reprendre (owner only)
- `emergencyWithdrawFromMorpho()` - Retrait d'urgence depuis Morpho (owner only)

### Fonctions Désactivées

- `withdraw()` - ❌ Désactivée, utiliser `redeem()` à la place
- `mint()` - ❌ Désactivée, utiliser `deposit()` à la place

## 🎯 Nouveaux Événements

- `DeadSharesMinted(deadShares, deadAddress)` - Émis lors du premier dépôt
- `SlippageGuardTriggered(user, expected, actual, operation)` - Émis lors de dépassement de slippage
- `EmergencyWithdraw(user, shares, assets)` - Émis lors de retrait d'urgence
- `Paused(account)` - Émis lors de la pause
- `Unpaused(account)` - Émis lors de la reprise

## ⚠️ Changements Critiques

### 1. Logique de Retrait Modifiée

```typescript
// ❌ AVANT (ne fonctionne plus)
writeContract({
  functionName: "withdraw",
  args: [assetAmount, receiver, owner],
});

// ✅ APRÈS (fonctionne)
writeContract({
  functionName: "redeem",
  args: [sharesAmount, receiver, owner],
});
```

### 2. maxWithdraw vs maxRedeem

```typescript
// ❌ AVANT
const maxWithdraw = useReadContract({
  functionName: "maxWithdraw",
});

// ✅ APRÈS
const maxRedeem = useReadContract({
  functionName: "maxRedeem",
});
```

### 3. Gestion des Shares vs Assets

- `redeem()` prend des **shares** en paramètre
- `withdraw()` prenait des **assets** en paramètre
- Nécessité de convertir entre shares et assets via `convertToShares()` et `convertToAssets()`

## 🔄 Processus de Mise à Jour

1. **Recompiler le contrat**: `forge build --force`
2. **Régénérer l'ABI**: `npm run generate-abi`
3. **Vérifier TypeScript**: `npm run typecheck`
4. **Tester l'application**: `npm run dev`

## 📝 Notes Importantes

- **Slippage Protection**: Maintenant intégrée au niveau du contrat
- **Dead Shares**: Préviennent les attaques d'inflation au premier dépôt
- **Emergency Functions**: Disponibles pour les situations critiques
- **Pause Mechanism**: Permet d'arrêter les opérations en cas de problème

## 🚀 Prochaines Étapes

1. Tester toutes les fonctionnalités en local
2. Déployer sur testnet pour validation
3. Effectuer des tests d'intégration complets
4. Documenter les nouveaux composants pour les utilisateurs

---

_Dernière mise à jour: $(date)_
