# L&L Loitsukirjakone

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

## Puutteet ja viat, korjausehdotukset?

Seuraavassa numerossa:

* Tulostuksen sivutus kuntoon, ainakin Edge(w11), Safari(Macos), Firefox ja Chrome.
* Komponentti-emojit ei välttämättä avaudu kaikille, checkboxilla valittavaksi teksti/emoji
* Loitsulista on vähän ruma
* Loitsulistaan koulufiltterit, 8 nappia
* Koulujen väritaustat ovat välttävät, ehkä joku M:tG tyylinen tekstuuri reunoihin ja teksteille valkea tausta?
* Kotipolttoisten loitsujen lisäys, ensin json sitten työkalu
* Loitsukirjan tallennus localstorageen

Minut saa parhaiten kiinni tämän asian tiimoilta Discordista nimimerkillä Keitto#2604, luen sitä paljon säännöllisemmin kuin Githubin viestejä.

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

Tämä työ on lisensoitu Creative Commons BY 4.0 -lisenssin mukaisesti, joka on saatavilla osoitteessa https://creativecommons.org/licenses/by/4.0/legalcode.

### Legendoja & Lohikäärmeitä SRD

Tämä työ sisältää materiaalia, joka on otettu Legendoja & Lohikäärmeitä SRD:stä ja on saatavilla osoitteessa https://github.com/Myrrys/LnL-SRD. Legendoja & Lohikäärmeitä SRD on lisensoitu Creative Commons BY 4.0 -lisenssin mukaisesti, joka on saatavilla osoitteessa https://creativecommons.org/licenses/by/4.0/legalcode.

### System Reference Document 5.1

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

### js-kirjasto Dragula 

(https://github.com/bevacqua/dragula) lisenssi MIT

### Fontit:

Solbera DnD fonts, jonathonf (https://github.com/jonathonf/solbera-dnd-fonts) et al., lisenssi CC-BY-SA 4.0

OFL-lisensoidut fontit, ks. `public/OFL`
