# L&L Loitsukirja

Generoi tulostettavia loitsukirjoja tulostettavaksi A4:lle vaakasuuntaan. Loitsutiedot on noudettu LnL-SRD:stä, ja mukana tulee työkalu, jolla loitsut voi pyöräyttää uudestaan tämän työkalun ymmärtämään muotoon, sikäli kun niihin tulee muutoksia.

## Käyttö (web-työkalu)

Ylälaidan työkalupalkissa on joitakin fonttiasetuksia, joilla voi säätää hieman tulostettavien korttien ulkoasua. Fonttikoko vaikuttaa koko kortin tekstisisältöön, fonttivalinnoista leipäteksti vaikuttaa kaikkeen muuhun paitsi otsikkoon, otsikko vain otsikkoon.

Vasemman laidan loitsulistaa voi suodattaa hakusanalla ja järjesteää piirin tai nimen mukaan nousevaksi.

Pääasiallinen työtila keskellä esittää vaakasuuntaista A4-paperia, johon voit vetää loitsuja listalta. Sivu koostuu kahdesta 2x2 ruudukosta, joiden keskellä on paperin taittamista varten tyhjää marginaalia.

Jotkin loitsut, vaikkapa **Happoroiske** ovat kuvaukseltaan tiiviitä, jolloin ne mahtuvat hyvin yksittäiseen loitsupaikkaan sivulla. Jotkin loitsut, kuten **Muodonmuutos** puolestaan vievät paljon tilaa. Tällöin pitkät loitsut voi raahata neljän loitsupaikan keskelle, jolloin niiden pitäisi asettua siten, että ne käyttävät toisen puolen sivusta kokonaan. Keskipitkät loitsut puolestaan voi pudottaa kahden loitsupaikan väliin, joko pysty- tai vaakasuunnassa.

## Tulostaminen

Sivu on suunniteltu siten, että sen pitäisi tulostua melko hyvin järjestelmän omalla tulosta-näkymällä. Jotkin selaimet tottelevat css-asetteluja paremmin kuin toiset, ja tämä on vielä työn alla.

## Omien loitsujen lisäys?

Ensimmäiseen versioon en tehnyt varsinaista loitsueditoria, mutta jos hostaat tämän itse, voit lisätä melko pienellä vaivalla loitsuja `public/data/spells.json` -tiedostoon. Vaihtoehtoisesti voit kirjoittaa markdown-tiedoston LnL-SRD-loitsujen rinnalle, ja rakentaa spells.jsonin uudestaan `scripts/build-spells`.json:illa.

## Hostaus

Voit hostata public-kansion sellaisenaan, jos sinulla on jokin webbipalvelin.

Vaihtoehtoisesti voit hostata paikallisena vaikkapa servellä:

```
npx serve public -l 8123
```

## Vaatimukset

- Loitsukirjakone on pyritty testaamaan suhteellisen uusilla selaimilla Edge (Windows), Firefox ja Safar (Macos)
- Jos tarvitset serve-palvelimen, tai haluat buildata loitsut uudestaan, tarvitset **Node.js**, **npm** ja **Git**  

## LnL-SRD submodule

Projektiin on määritetty submoduleksi Myrrysmiesten [LnL-SRD](https://github.com/Myrrys/LnL-SRD/), josta hyödynnetään markdown-muotoista loitsudataa, ja käännetään se helposti käsiteltäväksi jsoniksi. Projektissa on mukana kehityksenaikainen käännös näistä loitsuista, joten käyttäjän ei välttämättä tarvitse tehdä käännöstä uudestaan.

## Lisenssit

- LLLoitsukirjakone CC-BY-4.0
- LnL-SRD (https://github.com/Myrrys/LnL-SRD/) CC-BY 4.0
- js-kirjasto Dragula (https://github.com/bevacqua/dragula) MIT
- Fontit: 
    - jonathonf (https://github.com/jonathonf/solbera-dnd-fonts) et al., CC-BY-SA 4.0
    - OFL-lisensoidut fontit, ks. `public/OFL`