# RiseFi Frontend

## Affichage du rendement (APY) du Vault Morpho

Le composant `VaultApyDisplay` permet d'afficher en temps réel le rendement (APY) du vault Morpho principal, en interrogeant l'API GraphQL publique de Morpho.

### Fonctionnement

- **Aucune clé API n'est nécessaire** : l'API Morpho est publique.
- Le composant effectue une requête GraphQL sur l'endpoint :
  - `https://api.morpho.org/graphql`
- Il récupère la liste des vaults, filtre sur l'adresse du vault cible, et affiche le champ `netApy` (ou `apy` si indisponible).
- Le taux est rafraîchi automatiquement toutes les 60 secondes.

### Exemple de requête GraphQL utilisée

```graphql
query {
  vaults(first: 100) {
    items {
      address
      state {
        netApy
        apy
        rewards {
          supplyApr
        }
      }
    }
  }
}
```

### Exemple d'intégration dans une page Next.js

```tsx
import VaultApyDisplay from "@/components/VaultApyDisplay";

export default function Home() {
  return (
    <main>
      <VaultApyDisplay />
    </main>
  );
}
```

### Pour changer le vault affiché

Modifie la constante `VAULT_ADDRESS` dans `components/VaultApyDisplay.tsx` :

```ts
const VAULT_ADDRESS = "0x...".toLowerCase();
```

### Champs disponibles

- `netApy` : rendement net annualisé (recommandé)
- `apy` : rendement brut annualisé
- `rewards.supplyApr` : APR des rewards (si applicable)

### Dépendances

- Aucune dépendance externe (pas de clé API, pas de Provider urql)
- Utilise uniquement `fetch` natif et React

---

Pour toute question ou adaptation (autres métriques, historique, etc.), voir le code du composant ou demander à l'équipe technique.
