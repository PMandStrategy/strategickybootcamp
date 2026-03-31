# Strategický bootcamp – poznámky pro vývoj

## Termíny – přehled stavů a vzory kódu

V sekci "Vyber si svůj běh" (`#terminy`) se termíny zobrazují jako karty (`.term-card`). Každá karta může mít jeden ze tří stavů:

### 1. Otevřeny přihlášky (aktivní běh)

- **CSS třídy:** `.term-card.active` + `.term-badge.badge-open`
- **Badge text:** `Otevřeny přihlášky`
- **Vizuál:** Plná opacity, oranžový border (`border-color: var(--orange-btn)`), box-shadow, obsahuje CTA tlačítko "Přihlásit se →"

```html
<div class="term-card active">
  <span class="term-badge badge-open">Otevřeny přihlášky</span>
  <div class="term-dates">2. 4. — 14. 5. 2026</div>
  <p class="term-info">2. běh (6 týdnů)</p>
  <a href="https://forms.gle/24JvFxNRvER2H5vm9" target="_blank" rel="noopener" class="btn btn-primary">Přihlásit se &rarr;</a>
</div>
```

```css
.term-card.active {
  border-color: var(--orange-btn);
  box-shadow: 0 8px 36px rgba(198,122,37,0.15);
  opacity: 1;
}
.badge-open { background: var(--magenta); color: var(--white); }
```

### 2. Nábor ukončen (proběhlý nebo uzavřený běh)

- **CSS třídy:** `.term-card.inactive` + `.term-badge.badge-closed`
- **Badge text:** `Nábor ukončen`
- **Vizuál:** Snížená opacity (0.6), šedý border (výchozí `#E0DDD8`), šedý badge, **bez CTA tlačítka**

```html
<div class="term-card inactive">
  <span class="term-badge badge-closed">Nábor ukončen</span>
  <div class="term-dates">5. 2. — 19. 3. 2026</div>
  <p class="term-info">1. běh (6 týdnů)</p>
</div>
```

```css
.term-card.inactive { opacity: 0.6; }
.badge-closed { background: #E8E5E0; color: var(--warm-gray); }
```

### 3. Plánováno (budoucí běh, přihlášky ještě neotevřeny)

- **CSS třídy:** `.term-card.planned` + `.term-badge.badge-planned`
- **Badge text:** `Plánováno`
- **Vizuál:** Mírně snížená opacity (0.8), šedý border (výchozí), světle šedý badge, **bez CTA tlačítka**

```html
<div class="term-card planned">
  <span class="term-badge badge-planned">Plánováno</span>
  <div class="term-dates">11. 6. — 3. 9. 2026</div>
  <p class="term-info">3. běh (12 týdnů, pouze online)</p>
</div>
```

```css
.term-card.planned { opacity: 0.8; }
.badge-planned { background: #F0EDE8; color: var(--warm-gray); }
```

### Přechodový scénář

Typický životní cyklus karty termínu:
1. `planned` → karta bez tlačítka, badge "Plánováno"
2. `active` → otevření přihlášek, přidání CTA tlačítka, badge "Otevřeny přihlášky"
3. `inactive` → uzavření náboru, odebrání CTA tlačítka, badge "Nábor ukončen"
4. (volitelně) celá karta se může odebrat z HTML, pokud běh již proběhl a nechceme ho zobrazovat

### Historie změn termínů

| Commit | Změna |
|--------|-------|
| `2f59071` | Původní stav: 1. běh (inactive/uzavřen), 2. běh (active/otevřen), 3. běh (planned) |
| `3094966` | 3. běh změněn z `planned` na `active`, přidáno CTA tlačítko |
| `53f48d3` | Odebrán celý 1. běh (karta s "Nábor ukončen") |
