# TITAN.OS v8 - Second Brain Dashboard

Dashboard personnel tout-en-un avec intégration Whoop, tracking fitness, finance et routine.

## 🚀 Déploiement rapide sur Vercel

### Option 1 : Via GitHub (recommandé)

1. **Créer le repo GitHub**
   ```bash
   # Dans le dossier titan-os-app
   git init
   git add .
   git commit -m "Initial commit - TITAN.OS v8"
   
   # Créer un repo sur github.com puis :
   git remote add origin https://github.com/TON_USERNAME/titan-os.git
   git push -u origin main
   ```

2. **Connecter à Vercel**
   - Va sur [vercel.com](https://vercel.com)
   - "Add New Project"
   - Importe ton repo GitHub
   - Clique "Deploy"
   - C'est tout ! 🎉

3. **Mises à jour**
   ```bash
   # Modifie tes fichiers puis :
   git add .
   git commit -m "Description de la mise à jour"
   git push
   # Vercel redéploie automatiquement !
   ```

### Option 2 : Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 💻 Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode dev
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## 📁 Structure du projet

```
titan-os-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Code principal TITAN.OS
│   ├── main.jsx         # Point d'entrée React
│   └── index.css        # Styles globaux + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## ⚙️ Configuration Whoop (à venir)

Pour activer l'intégration Whoop réelle :

1. Créer une app sur [developer.whoop.com](https://developer.whoop.com)
2. Configurer le redirect URI : `https://ton-domaine.vercel.app/callback`
3. Ajouter les variables d'environnement dans Vercel :
   - `VITE_WHOOP_CLIENT_ID`
   - `VITE_WHOOP_CLIENT_SECRET`

## 🔧 Personnalisation

### Changer le thème
Modifie les variables CSS dans `src/index.css` :
```css
:root {
  --color-bg-primary: #030305;
  --color-accent: #3b82f6;
  /* ... */
}
```

### Ajouter des exercices
Modifie `EXERCISES_DB` dans `src/App.jsx`

### Modifier les compléments
Modifie `SUPPLEMENTS_ROUTINE` dans `src/App.jsx`

## 📱 PWA (Progressive Web App)

Pour transformer en app installable, ajoute un fichier `manifest.json` dans `/public`.

---

Made with 💪 by TITAN.OS
