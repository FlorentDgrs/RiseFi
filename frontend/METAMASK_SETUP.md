# 🦊 Configuration Metamask pour Anvil Local

## 🚨 Problème Identifié

Vous voyez des transactions dans les logs Anvil mais pas dans Metamask ? C'est parce que **Metamask n'est pas connecté au réseau Anvil local**.

## ✅ Solution : Ajouter le Réseau Anvil

### **Étape 1 : Ouvrir Metamask**

1. Cliquez sur l'icône Metamask dans votre navigateur
2. Cliquez sur le sélecteur de réseau (en haut)
3. Cliquez sur "Ajouter un réseau" ou "Add Network"

### **Étape 2 : Ajouter le Réseau Anvil**

Entrez ces informations **exactement** :

```
Nom du réseau : Anvil Local
RPC URL : http://127.0.0.1:8545
Chain ID : 31337
Symbole : ETH
Block Explorer : (laisser vide)
```

### **Étape 3 : Importer un Wallet de Test**

Utilisez une des clés privées Anvil (NE JAMAIS utiliser en production) :

```
Clé privée : 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Adresse : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### **Étape 4 : Vérifier la Configuration**

1. Changez vers le réseau "Anvil Local"
2. Vous devriez voir ~10,000 ETH dans votre wallet
3. Reconnectez-vous sur le frontend RiseFi

## 🔧 Dépannage

### **Transaction visible dans Anvil mais pas Metamask ?**

- ✅ Vérifiez que vous êtes sur le réseau "Anvil Local" (chainId: 31337)
- ✅ Vérifiez que l'URL RPC est `http://127.0.0.1:8545`
- ✅ Redémarrez Metamask si nécessaire

### **Erreurs "execution reverted" ?**

- ✅ Normal pour les appels `supportsInterface` - ignorez ces erreurs
- ✅ Les vraies transactions passent quand même

### **Pas de USDC dans votre wallet ?**

Ajoutez le token USDC manuellement :

```
Adresse : 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Symbole : USDC
Décimales : 6
```

## 🎯 Test Final

1. Connectez-vous au frontend avec Metamask sur "Anvil Local"
2. Vous devriez voir votre balance ETH et USDC
3. Les transactions devraient apparaître dans Metamask

## ⚠️ Sécurité

**IMPORTANT** : Ces clés privées sont publiques et **NE DOIVENT JAMAIS** être utilisées sur un réseau réel. Elles sont uniquement pour le développement local.
