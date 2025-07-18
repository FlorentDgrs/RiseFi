# RiseFi Smart Contracts

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)

Smart contracts for the **RiseFi** DeFi yield vault platform, built with Foundry and featuring **Morpho Blue integration** on Base network.

## 📋 Contracts

### RiseFiVault.sol

**ERC-4626 compliant vault with Morpho Blue integration:**

- ✅ **Standard ERC-4626 interface** with 6-decimal USDC support
- ✅ **Morpho Blue integration** for enhanced yields
- ✅ **Inflation attack protection** with dead shares mechanism
- ✅ **Slippage protection** for secure withdrawals
- ✅ **Gas optimized** with professional patterns
- ✅ **Comprehensive testing** with 86+ tests and high coverage

### Key Features

- **Morpho Integration**: Direct integration with Morpho vaults on Base network
- **Dead Shares Protection**: 1000 dead shares prevent inflation attacks
- **Slippage Tolerance**: 1% tolerance for withdrawal safety
- **ERC-4626 Compliance**: Full standard compliance with proper rounding
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

# Install frontend dependencies
cd frontend && npm install
```

## 🎯 **DÉPLOIEMENT COMPLET - SÉQUENCE SIMPLIFIÉE**

### **1. Déploiement Backend Automatisé**

```bash
cd RiseFi && ./scripts/deploy-complete.sh
```

**Ce script fait automatiquement :**

- 🔄 Démarre Anvil (fork Base network)
- 🧹 Nettoie les artifacts
- 🏦 Déploie le vault RiseFi
- 📍 **Affiche l'adresse du vault**
- 💰 Finance la whale avec ETH
- 💸 Finance les wallets avec USDC (10,000 USDC chacun)
- ✅ Vérifie tous les soldes
- 📋 Affiche un résumé complet

**Résultat attendu :**

```
🎯 ========================================
🏦 VAULT RISEFI DÉPLOYÉ AVEC SUCCÈS !
📍 Adresse: 0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A
🎯 ========================================

🔗 Adresses importantes:
   📍 Vault RiseFi: 0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A
   📍 USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   📍 Whale: 0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D
```

### **2. Démarrer le Frontend**

```bash
cd frontend && npm run dev
```

**Frontend accessible sur :** `http://localhost:3000/dashboard`

### **3. Configuration MetaMask**

- **Réseau** : Local (Chain ID: 31337)
- **RPC URL** : `http://localhost:8545`
- **Comptes de test** : Utiliser les clés privées Anvil

### **4. Tester l'Application**

1. Connecter MetaMask au réseau local
2. Aller sur `http://localhost:3000/dashboard`
3. Tester le dépôt USDC → rfUSDC
4. Tester le retrait rfUSDC → USDC

### **5. Arrêter les Services**

```bash
cd RiseFi && ./scripts/stop-all.sh
```

## 🔧 **Scripts Disponibles**

### **Backend (RiseFi/scripts/)**

- **`deploy-complete.sh`** : Déploiement complet automatisé (Anvil + Contracts + Funding)
- **`stop-all.sh`** : Arrêt propre de tous les services

### **Solidity (RiseFi/script/)**

- **`DeployVault.s.sol`** : Déploiement du vault RiseFi (compatible avec la dernière version du contrat)
- **`FundTestWallets.s.sol`** : Financement des wallets de test

#### Exemple d'utilisation du script de déploiement avec Foundry

```bash
forge script script/DeployVault.s.sol --rpc-url <URL_RPC> --broadcast --private-key <PRIVATE_KEY>
```

## 📊 **Adresses Importantes**

### **Réseau Local (Anvil - Chain ID: 31337)**

- **USDC** : `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Whale USDC** : `0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D`
- **Vault RiseFi** : Affiché lors du déploiement

### **Comptes de Test (Anvil)**

- **Account 0** : `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 1** : `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 2** : `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

_Chaque compte est financé avec 10,000 USDC pour les tests_

## 🛠️ **Développement Avancé**

### Build

```bash
forge build
```

### Test

```bash
# Tests unitaires (86+ tests, coverage >90% lignes/fonctions, ~70% branches)
forge test

# Tests avec verbosité
forge test -vvv

# Tests de couverture (en ignorant les scripts)
forge coverage --ignore script/
```

#### Couverture actuelle (exemple)

- **Lignes** : >90%
- **Fonctions** : >90%
- **Branches** : ~70% (certaines branches catch/erreur sont impossibles à atteindre sur un fork réel)

#### Ignorer les scripts dans la couverture

Ajoutez dans `foundry.toml` :

```toml
[profile.default]
ignored = ["script/*"]
```

Ou utilisez l’option CLI :

```bash
forge coverage --ignore script/
```

### Bonnes pratiques tests

- Utilisation systématique de l’impersonation (`vm.startPrank`) pour simuler différents utilisateurs (user, owner, whale, etc.)
- Tests edge cases (zero address, min/max, slippage, etc.)
- Fuzzing sur les fonctions critiques
- Tests de stress (beaucoup de dépôts/retraits)
- Vérification des événements et des erreurs custom
- Couverture des branches critiques (slippage, pausable, dead shares, etc.)

### À propos des scripts

- Les scripts de déploiement (`script/DeployVault.s.sol`, etc.) **ne sont pas à tester** : ils servent uniquement à l’automatisation du déploiement et du funding.
- **Ignorez-les dans la couverture** pour avoir un % coverage représentatif de la sécurité/qualité de vos contrats.
- Le script `DeployVault.s.sol` est à jour et compatible avec la dernière version du contrat.

### Déploiement Manuel

```bash
# Démarrer Anvil
anvil --fork-url https://mainnet.base.org --fork-block-number 32778110

# Déployer le vault
forge script script/DeployVault.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Financer les wallets
forge script script/FundTestWallets.s.sol:FundTestWallets --rpc-url http://localhost:8545 --broadcast --unlocked
```

## 📁 **Structure du Projet**

```
RiseFi/
├── scripts/
│   ├── deploy-complete.sh    # 🚀 Déploiement complet
│   └── stop-all.sh          # 🛑 Arrêt services
├── script/
│   ├── DeployVault.s.sol    # 🏦 Déploiement vault
│   └── FundTestWallets.s.sol # 💰 Financement wallets
├── src/
│   └── RiseFiVault.sol      # 📜 Contrat principal
├── test/
│   └── RiseFiVault.t.sol    # 🧪 Tests
└── frontend/
    ├── components/shared/
    │   └── VaultActions.tsx  # 🎯 Interface principale
    └── app/dashboard/
        └── page.tsx         # 📱 Page dashboard
```

## 🎯 **Workflow Recommandé**

1. **Développement** : `./scripts/deploy-complete.sh` → `cd frontend && npm run dev`
2. **Tests** : Utiliser `http://localhost:3000/dashboard` avec MetaMask
3. **Nettoyage** : `./scripts/stop-all.sh`

## 📝 **Notes Importantes**

- **Réseau** : Fork de Base mainnet (block 32778110)
- **Tokens** : USDC (6 décimales) → rfUSDC (18 décimales)
- **Sécurité** : Protection contre les attaques d'inflation
- **Gas** : Optimisé pour les coûts de transaction
- **Tests** : Couverture complète avec cas limites, fuzz, impersonation, edge cases

## 🤝 **Contribution**

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 **License**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
