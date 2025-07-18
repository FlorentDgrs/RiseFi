# 🔐 Test de la Logique d'Approbation

## 🚨 Problème Identifié

L'erreur `ERC20: transfer amount exceeds allowance` indique que l'approbation USDC n'est pas gérée correctement. Nous avons restauré la logique de double confirmation.

## ✅ Logique d'Approbation Restaurée

### **Séquence Normale (2 transactions Metamask)**

1. **Première transaction** : `approve()` - Approuve le vault à dépenser vos USDC
2. **Attente confirmation** : Le frontend attend que l'approbation soit confirmée
3. **Deuxième transaction** : `deposit()` - Dépose les USDC dans le vault

### **Code Corrigé**

```typescript
// Dans handleAction() :
if (safeAllowance < amountBN) {
  setStatus("approving");
  writeApprove({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "approve",
    args: [VAULT_ADDRESS, amountBN * BigInt(2)], // 2x le montant
  });
  return; // STOP ici, attend la confirmation
}

// Dans useEffect() :
if (isSuccess && status === "approving") {
  // L'approbation est confirmée → faire le deposit
  setStatus("depositing");
  writeDeposit({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [amountBN, address],
  });
}
```

## 🧪 Test à Effectuer

### **Étape 1 : Vérifier Metamask**

- Assurez-vous d'être sur le réseau "Anvil Local" (chainId: 31337)
- Vérifiez que vous avez des USDC (voir METAMASK_SETUP.md)

### **Étape 2 : Tester un Dépôt**

1. Entrez un montant (ex: 10 USDC)
2. Cliquez sur "Deposit"
3. **Première popup Metamask** : Approbation USDC
   - Fonction : `approve()`
   - Montant : 2x votre dépôt (ex: 20 USDC)
   - Confirmez
4. **Attendre** : Le frontend affiche "Approving..."
5. **Deuxième popup Metamask** : Dépôt réel
   - Fonction : `deposit()`
   - Montant : Votre dépôt (ex: 10 USDC)
   - Confirmez

### **Étape 3 : Vérifier les Logs Anvil**

Dans les logs, vous devriez voir :

```
eth_sendRawTransaction
    Transaction: 0x... (approve)
    Gas used: ~46000

eth_sendRawTransaction
    Transaction: 0x... (deposit)
    Gas used: ~200000
```

## 🔧 Dépannage

### **Toujours "ERC20: transfer amount exceeds allowance" ?**

1. Vérifiez que les 2 transactions Metamask apparaissent
2. Vérifiez que la première (approve) est confirmée avant la seconde
3. Rechargez la page et réessayez

### **Une seule transaction Metamask ?**

- Vous avez déjà une approbation suffisante
- Le frontend passe directement au deposit
- C'est normal après le premier dépôt

### **Erreur TypeScript dans la console ?**

- Ignorez l'erreur `Type 'undefined' is not assignable`
- Elle n'affecte pas la fonctionnalité
- Sera corrigée dans une version future

## 📊 États du Frontend

- **"Approving..."** : Première transaction en cours
- **"Depositing..."** : Deuxième transaction en cours
- **"Done"** : Succès complet
- **"Error"** : Échec (vérifiez les logs)

## 🎯 Résultat Attendu

Après un dépôt réussi :

- ✅ Balance USDC diminue
- ✅ Balance rfUSDC augmente
- ✅ "Invested Amount" mis à jour
- ✅ Input se vide automatiquement
