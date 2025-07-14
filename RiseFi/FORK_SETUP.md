# Guide de Configuration du Fork Base - RiseFi

Ce guide explique comment configurer un environnement de développement avec un fork Base, des wallets financés avec du vrai USDC, et le déploiement du RiseFiVault.

## 🚀 Démarrage Rapide

### **Workflow Principal (2 terminaux)**

```bash
# Terminal 1 - Démarrer le fork Base
cd RiseFi/
./scripts/start-anvil.sh

# Terminal 2 - Déployer le vault + financer les wallets
cd RiseFi/
./scripts/fund-and-deploy.sh

# Terminal 3 - Lancer le frontend
cd frontend/
npm run dev
```

## 📋 Configuration Metamask

### **Réseau de Test**

- **Nom du réseau :** Base Fork (Local)
- **RPC URL :** `http://localhost:8545`
- **Chain ID :** `8453`
- **Symbole :** `ETH`
- **Block Explorer :** (laisser vide)

### **Comptes de Test**

Importez ces clés privées dans Metamask :

```
Account 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Account 1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Account 2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Account 3: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Account 4: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

Après le funding, chaque compte aura **1000 USDC** + **10000 ETH**.

## 🔧 Scripts Détaillés

### **1. start-anvil.sh**

```bash
#!/bin/bash
# Démarre Anvil avec fork Base mainnet
anvil \
    --fork-url "https://mainnet.base.org" \
    --chain-id 8453 \
    --port 8545 \
    --host 127.0.0.1 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000
```

### **2. fund-and-deploy.sh**

```bash
#!/bin/bash
# 1. Finance les wallets avec USDC depuis la whale
# 2. Déploie le RiseFiVault avec les bonnes adresses

# Funding des wallets
forge script script/FundTestWallets.s.sol:FundTestWallets \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --unlocked \
    --sender 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3

# Déploiement du vault
forge script script/DeployVault.s.sol:DeployVault \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 🏗️ Architecture Technique

### **Adresses Importantes**

```solidity
// Base Mainnet (utilisées dans le fork)
USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Morpho Vault: 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858
USDC Whale: 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3

// Déployé sur le fork
RiseFiVault: [adresse générée lors du déploiement]
```

### **Flux de Données**

```
1. Fork Base Mainnet → Anvil local (port 8545)
2. Whale USDC → Wallets de test (1000 USDC chacun)
3. RiseFiVault → Morpho Vault (yield farming)
4. Frontend → RiseFiVault (interface utilisateur)
```

## 🧪 Tests et Vérifications

### **Vérifier le Fork**

```bash
# Vérifier la connexion
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://localhost:8545

# Vérifier le balance USDC de la whale
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "balanceOf(address)(uint256)" \
  0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3 \
  --rpc-url http://localhost:8545
```

### **Vérifier les Wallets Financés**

```bash
# Balance USDC du compte 0
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "balanceOf(address)(uint256)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545
```

### **Vérifier le Déploiement du Vault**

```bash
# Lire les logs de déploiement
cat broadcast/DeployVault.s.sol/8453/run-latest.json | jq '.transactions[0].contractAddress'
```

## 🚨 Dépannage

### **Erreurs Communes**

1. **"Anvil n'est pas démarré"**

   - Vérifier que le terminal 1 avec `start-anvil.sh` est toujours actif
   - Attendre quelques secondes après le démarrage d'Anvil

2. **"Whale balance insuffisant"**

   - Le fork Base est peut-être obsolète
   - Redémarrer Anvil avec un fork frais

3. **"Deployment failed"**
   - Vérifier que les adresses USDC et Morpho Vault sont correctes
   - Vérifier que le compte deployer a assez d'ETH

### **Restart Complet**

```bash
# Tuer tous les processus Anvil
pkill -f anvil

# Nettoyer les broadcasts
rm -rf broadcast/

# Redémarrer depuis le début
./scripts/start-anvil.sh
```

## 📊 Métriques de Performance

Après le setup complet, vous devriez avoir :

- ✅ Fork Base fonctionnel sur localhost:8545
- ✅ 5 wallets avec 1000 USDC + 10000 ETH chacun
- ✅ RiseFiVault déployé et fonctionnel
- ✅ Frontend prêt à interagir avec le vault

**Temps total de setup :** ~30 secondes
**Ressources utilisées :** ~200MB RAM pour Anvil
