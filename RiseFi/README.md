# RiseFi Smart Contracts

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)

Smart contracts for the **RiseFi** DeFi yield vault platform, built with Foundry and featuring **Morpho Blue integration** on Base network.

## 📋 Overview

### RiseFiVault.sol

**ERC-4626 compliant vault with Morpho Blue integration:**

- ✅ **Standard ERC-4626 interface** with 6-decimal USDC support
- ✅ **Morpho Blue integration** for enhanced yields on Base network
- ✅ **Inflation attack protection** with dead shares mechanism
- ✅ **Slippage protection** (1% tolerance) for secure withdrawals
- ✅ **Gas optimized** with professional patterns
- ✅ **Comprehensive testing** with 96+ tests and >95% coverage
- ✅ **Admin controls** with pause/unpause functionality
- ✅ **Emergency withdrawal** for critical situations

### Key Features

- **Morpho Integration**: Direct integration with Morpho vaults on Base network
- **Dead Shares Protection**: 1000 dead shares prevent inflation attacks
- **Slippage Tolerance**: 1% tolerance for withdrawal safety
- **ERC-4626 Compliance**: Full standard compliance with proper rounding
- **Admin Controls**: Pause/unpause functionality for emergency situations
- **Emergency Withdrawal**: Admin can withdraw from Morpho vault to contract
- **Professional Documentation**: Complete NatSpec documentation in English

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- [Node.js](https://nodejs.org/) and npm for frontend
- Base network RPC access for fork testing

### Installation

```bash
# Install Foundry dependencies
forge install

# Install frontend dependencies (optional)
cd ../frontend && npm install
```

## 🎯 **DÉPLOIEMENT COMPLET - GUIDE SIMPLIFIÉ**

### **Option 1: Déploiement Automatisé**

#### **🐌 Mode Standard (Recommandé pour la production)**

```bash
cd RiseFi
./scripts/deploy-complete.sh
```

**Caractéristiques :**

- ⏰ Blocks toutes les 12 secondes (comme Base mainnet)
- 🎯 Parfait pour tester en conditions réelles
- 🔄 Yields visibles après quelques minutes

#### **⚡ Mode Rapide (Recommandé pour le développement)**

```bash
cd RiseFi
./scripts/deploy-fast.sh
```

**Caractéristiques :**

- ⏰ Blocks toutes les 1 seconde (12x plus rapide)
- 🚀 Yields visibles rapidement
- 🔄 Développement plus efficace

#### **🚀 Mode Ultra-Rapide (Recommandé pour les tests intensifs)**

```bash
cd RiseFi
./scripts/deploy-ultra-fast.sh
```

**Caractéristiques :**

- ⏰ Blocks instantanés (seulement quand nécessaire)
- 🚀 Transactions instantanées
- 🎯 Parfait pour les tests automatisés

**Tous les scripts font automatiquement :**

- 🔄 Démarre Anvil (fork Base network au block 32778110)
- 🧹 Nettoie les artifacts de build
- 🏦 Déploie le vault RiseFi
- 📍 **Affiche l'adresse du vault déployé**
- 💰 Finance la whale avec ETH
- 💸 Finance 3 wallets avec 1,000,000 USDC chacun
- ✅ Vérifie tous les soldes
- 📋 Affiche un résumé complet

**Résultat attendu :**

```
🎯 ========================================
🏦 VAULT RISEFI DÉPLOYÉ AVEC SUCCÈS !
📍 Adresse: 0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A
🎯 ========================================

💰 Wallet 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266: 1000000.00 USDC
💰 Wallet 0x70997970C51812dc3A010C7d01b50e0d17dc79C8: 1000000.00 USDC
💰 Wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC: 1000000.00 USDC

🔗 Adresses importantes:
   📍 Vault RiseFi: 0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A
   📍 USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   📍 Whale: 0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D
```

### **Option 2: Déploiement Manuel**

```bash
# 1. Démarrer Anvil
anvil --fork-url https://mainnet.base.org \
      --fork-block-number 32778110 \
      --chain-id 31337 \
      --port 8545 \
      --accounts 10 \
      --balance 10000 \
      --gas-limit 30000000 \
      --base-fee 0 \
      --auto-impersonate

# 2. Déployer le vault (dans un autre terminal)
cd RiseFi
forge script script/DeployVault.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
  -v

# 3. Financer les wallets de test
forge script script/FundTestWallets.s.sol:FundTestWallets \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --unlocked \
  -v
```

### **Démarrer le Frontend (Optionnel)**

```bash
cd ../frontend && npm run dev
```

**Frontend accessible sur :** `http://localhost:3000/dashboard`

### **Configuration MetaMask**

- **Réseau** : Local (Chain ID: 31337)
- **RPC URL** : `http://localhost:8545`
- **Comptes de test** : Utiliser les clés privées Anvil

### **Arrêter les Services**

```bash
# Arrêter Anvil
pkill -f anvil
# ou utiliser le PID affiché lors du démarrage
kill <PID>
```

## 🔧 **Scripts Disponibles**

### **Scripts Shell (RiseFi/scripts/)**

- **`deploy-complete.sh`** : Déploiement standard (blocks 12s, conditions réelles)
- **`deploy-fast.sh`** : Déploiement rapide (blocks 1s, développement)
- **`stop-all.sh`** : Arrêt propre de tous les services (si disponible)

### **Scripts Solidity (RiseFi/script/)**

- **`DeployVault.s.sol`** : Déploiement du vault RiseFi
- **`FundTestWallets.s.sol`** : Financement des wallets de test avec USDC

## 📊 **Adresses Importantes**

### **Réseau Local (Anvil - Chain ID: 31337)**

- **USDC (Base)** : `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Morpho Vault** : `0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858`
- **Whale USDC** : `0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D`
- **Vault RiseFi** : Affiché lors du déploiement (ex: `0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A`)

### **Comptes de Test (Anvil)**

- **Account 0** : `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 1** : `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 2** : `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

_Chaque compte est financé avec 1,000,000 USDC pour les tests_

## 🛠️ **Développement**

### Build

```bash
forge build
```

### Test

```bash
# Tests unitaires (96+ tests, coverage >95%)
forge test

# Tests avec verbosité
forge test -vvv

# Tests de couverture
forge coverage
```

#### Couverture Actuelle

- **Lignes** : >95%
- **Fonctions** : >95%
- **Branches** : ~85%

Les tests incluent :

- Tests unitaires pour toutes les fonctions
- Tests d'intégration avec Morpho
- Tests de cas limites (edge cases)
- Tests de fuzzing pour la robustesse
- Tests de couverture des branches
- Tests de sécurité (slippage, pause, emergency)

### Linting et Formatage

```bash
# Formater le code Solidity
forge fmt

# Vérifier le formatage
forge fmt --check
```

## 📁 **Structure du Projet**

```
RiseFi/
├── scripts/
│   └── deploy-complete.sh    # 🚀 Déploiement complet automatisé
├── script/
│   ├── DeployVault.s.sol     # 🏦 Déploiement vault
│   └── FundTestWallets.s.sol # 💰 Financement wallets
├── src/
│   └── RiseFiVault.sol       # 📜 Contrat principal ERC-4626
├── test/
│   └── RiseFiVaultOptimized.t.sol # 🧪 Tests complets (96+ tests)
├── lib/                      # 📚 Dépendances Foundry
├── out/                      # 🏗️ Artifacts de build
├── cache/                    # 💾 Cache Foundry
└── broadcast/                # 📡 Logs de déploiement
```

## 🎯 **Workflow Recommandé**

### **Pour le Développement**

1. **Déploiement** :
   - Production : `./scripts/deploy-complete.sh`
   - Développement : `./scripts/deploy-fast.sh`
2. **Tests** : `forge test`
3. **Frontend** : `cd ../frontend && npm run dev` (optionnel)
4. **Nettoyage** : `pkill -f anvil`

### **Pour les Tests**

1. **Tests unitaires** : `forge test`
2. **Tests avec traces** : `forge test -vvv`
3. **Couverture** : `forge coverage`
4. **Tests spécifiques** : `forge test --match-test testFunctionName`

## 📝 **Notes Techniques**

- **Réseau** : Fork de Base mainnet (block 32778110)
- **Tokens** : USDC (6 décimales) → rfUSDC (18 décimales)
- **Sécurité** : Protection contre les attaques d'inflation avec dead shares
- **Gas** : Optimisé pour les coûts de transaction
- **Tests** : Couverture complète avec cas limites et fuzz testing
- **Architecture** : ERC-4626 compliant avec intégration Morpho Blue

## 🔒 **Sécurité**

- **Audits** : Tests exhaustifs avec >95% de couverture
- **Protection** : Dead shares contre les attaques d'inflation
- **Slippage** : Protection 1% sur les retraits
- **Pause** : Mécanisme d'urgence pour arrêter les opérations
- **Accès** : Contrôles d'accès avec OpenZeppelin Ownable

## 🤝 **Contribution**

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 **License**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe RiseFi**
