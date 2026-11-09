/* Base de datos local de Spyle (SPYLE // CONTRAINTELIGENCIA).
 *
 * Formato de cada prompt:
 *   id, pack ("general" = Reto Diario / Unlimited), texto, ejemplo (respuesta de 100 pts) y
 *   answers: { "clave normalizada": puntos }  con puntos ∈ {10, 25, 45, 65, 85, 100}.
 * Claves en minúsculas, sin tildes y sin "ñ" (el motor normaliza la entrada igualmente).
 * Los 7 prompts de prueba de los packs temáticos usan el formato antiguo "respuestas" por tier,
 * que el motor sigue soportando.
 */
const PACKS = [
  { id: "palabras",  nombre: "Palabras y Lenguaje", icono: "📖" },
  { id: "peliculas", nombre: "Películas",           icono: "🎬" },
  { id: "deportes",  nombre: "Deportes",            icono: "⚽" },
  { id: "geografia", nombre: "Geografía",           icono: "🌍" },
  { id: "musica",    nombre: "Música",              icono: "🎵" }
];

/* ===================== ESTRUCTURA DE RETOS DIARIOS (BLOQUES CERRADOS DE 7 CATEGORÍAS) ===================== */
const DAILY_MISSIONS = {
  1: {
    id: "dia_1",
    dia: 1,
    nombre: "Operación Génesis",
    fecha: "7 nov 2026",
    prompts: ["gen-001", "gen-002", "gen-003", "gen-004", "gen-005", "gen-006", "gen-007"],
    easterEgg: { promptId: "gen-005", word: "delorean" }
  },
  2: {
    id: "dia_2",
    dia: 2,
    nombre: "Operación Doble Cero",
    fecha: "8 nov 2026",
    prompts: ["gen-008", "gen-009", "gen-010", "gen-011", "gen-012", "gen-013", "gen-014"],
    easterEgg: { promptId: "gen-010", word: "liechtenstein" }
  },
  3: {
    id: "dia_3",
    dia: 3,
    nombre: "Operación Sobremesa",
    fecha: "9 nov 2026",
    prompts: ["gen-015", "gen-016", "gen-017", "gen-018", "gen-019", "gen-020", "gen-021"],
    easterEgg: { promptId: "gen-019", word: "mantecado" }
  }
};
DAILY_MISSIONS.dia_1 = DAILY_MISSIONS[1];
DAILY_MISSIONS.dia_2 = DAILY_MISSIONS[2];
DAILY_MISSIONS.dia_3 = DAILY_MISSIONS[3];
if (typeof window !== "undefined") window.DAILY_MISSIONS = DAILY_MISSIONS;


const PROMPTS = [
  /* ===================== BLOQUE GENERAL 1 (14 prompts = 2 días) ===================== */
  {
    id: "gen-001", pack: "general",
    texto: "Marca de yogures o postres lácteos vendida en España",
    ejemplo: "sojasun",
    answers: {
      "danone": 10, "activia": 10, "actimel": 10, "danonino": 10, "nestle": 10, "la lechera": 10, "lechera": 10, "danet": 10, "pascual": 10, "vitalinea": 10, "oikos": 10, "yoplait": 10, "kaiku": 10, "puleva": 10, "central lechera asturiana": 10, "asturiana": 10, "dhul": 10, "reina": 10, "postres reina": 10, "clesa": 10,
      "hacendado": 25, "mercadona": 25, "milbona": 25, "lidl": 25, "carrefour": 25, "carrefour classic": 25, "carrefour bio": 25, "alcampo": 25, "auchan": 25, "dia": 25, "delicious dia": 25, "eroski": 25, "eroski seleqtia": 25, "consum": 25, "caprabo": 25, "bonpreu": 25, "bonarea": 25, "alteza": 25, "spar": 25, "gutbio": 25, "eliges": 25, "milsani": 25, "aldi": 25, "hipercor": 25, "el corte ingles": 25, "corte ingles": 25, "supercor": 25, "coviran": 25, "ahorramas": 25, "gadis": 25, "alimerka": 25, "yogur": 25, "yogurt": 25, "yoghourt": 25, "kefir": 25, "cuajada": 25, "natillas": 25, "flan": 25, "arroz con leche": 25, "petit suisse": 25, "petit": 25,
      "yopro": 45, "dalki": 45, "flanby": 45, "sveltesse": 45, "chiquitin": 45, "nesquik": 45, "kit kat": 45, "lion": 45, "smarties": 45, "milkybar": 45, "danup": 45, "densia": 45, "yolado": 45, "natillas danone": 45, "cuajada danone": 45, "yogikids": 45, "fage": 45, "chobani": 45, "alpro": 45, "ehrmann": 45, "lindahls": 45, "lindahls pro": 45, "arla": 45, "valio": 45, "feiraco": 45, "larsa": 45, "llet nostra": 45, "covap": 45, "fageda": 45, "la fageda": 45, "pastoret": 45, "kalise": 45, "lauki": 45, "flan chino mandarin": 45, "royal": 45, "muller": 45,
      "casa grande de xanceda": 65, "xanceda": 65, "postres montero": 65, "gaza": 65, "leche gaza": 65, "ato": 65, "deleite": 65, "leyma": 65, "celta": 65, "goshua": 65, "cantero de letur": 65, "el cantero de letur": 65, "sojasun": 65, "isey": 65, "isey skyr": 65, "skyr": 65, "myprotein": 65, "prozis": 65, "hsn": 65, "feastables": 65, "mrbeast": 65, "mr beast": 65, "prime": 65, "abbot kinney": 65, "savia": 65, "natursoy": 65, "sojade": 65, "andros": 65, "provamel": 65, "larra": 65, "mamia": 65, "ultzama": 65,
      "granja badia": 85, "beteta": 85, "casa vieja": 85, "bico de xeado": 85, "lacturale": 85, "beyena": 85, "koralium": 85, "quesos cerrato": 85, "romar": 85, "postres romar": 85, "flan mandarin": 85, "potax": 85, "maizena": 85, "chambourcy": 85,
      "la ermita cantabria": 100, "postres la ermita": 100, "granja rinya": 100, "rinya": 100, "lacteos cobreros": 100, "casa amella": 100, "yosoy": 100
    }
  },
  {
    id: "gen-002", pack: "general",
    texto: "Sinónimo en español de «feliz»",
    ejemplo: "bienhadado",
    answers: {
      "contento": 10, "alegre": 10, "dichoso": 10, "satisfecho": 10, "risueño": 10, "jovial": 10, "radiante": 10, "afortunado": 10, "animado": 10, "entusiasmado": 10, "encantado": 10, "ilusionado": 10, "complacido": 10, "pleno": 10, "exultante": 10, "pletorico": 10, "alborozado": 10, "gozoso": 10,
      "happy": 25, "happy de la vida": 25, "feliz como una perdiz": 25, "en una nube": 25, "en el septimo cielo": 25, "de puta madre": 25, "de lujo": 25, "de fabula": 25, "en la gloria": 25, "chachi": 25, "guay": 25, "fetem": 25, "fetien": 25, "living": 25, "flotando": 25, "contento de la vida": 25, "sonriente": 25, "positivo": 25, "optimista": 25, "genial": 25, "euforico": 25, "motivado": 25, "hypeado": 25, "contento como unas castañuelas": 25, "feliz como un regaliz": 25, "bien": 25, "super bien": 25, "alegre como unas pascuas": 25, "en su salsa": 25, "de buen humor": 25,
      "bienaventurado": 45, "jubiloso": 45, "jubilante": 45, "regocijado": 45, "venturoso": 45, "ufano": 45, "boyante": 45, "festivo": 45, "placido": 45, "contentisimo": 45, "dicharachero": 45, "expansivo": 45, "descansado": 45, "tranquilo": 45, "sosegado": 45, "reconfortado": 45, "gratificado": 45, "triunfal": 45, "realizado": 45, "extasiado": 45, "regocijante": 45, "divertido": 45, "deleitado": 45, "halagado": 45, "agraciado": 45, "bendecido": 45, "fausto": 45, "ilusionadisimo": 45, "alegrisimo": 45, "esperanzado": 45, "alegron": 45, "emocionado": 45, "conmovido": 45, "gozador": 45,
      "jacarandoso": 65, "pancho": 65, "bienandante": 65, "ancho": 65, "ancho como un ocho": 65, "campante": 65, "rozagante": 65, "satisfechisimo": 65, "transportado": 65, "embelesado": 65, "arrobado": 65, "entusiasta": 65, "ufanisimo": 65, "vivaracho": 65, "confortado": 65, "albricioso": 65, "dichosisimo": 65, "euforiquisimo": 65, "pletoriquisimo": 65, "gocoso": 65, "triunfante": 65, "bienlibrado": 65, "rejuvenecido": 65, "animadisimo": 65,
      "ledo": 85, "gayo": 85, "bienhadado": 85, "inmarcesible": 85, "jovialon": 85, "arrobador": 85, "dichante": 85, "suertudo": 85, "bendito": 85, "placero": 85, "rison": 85, "sonreidor": 85, "regocijoso": 85, "ilusionante": 85, "afortunadisimo": 85, "venturosisimo": 85, "faustisimo": 85, "beatifico": 85, "beatificado": 85, "glorioso": 85, "bienquisto": 85,
      "jovialerrimo": 100, "felicerrimo": 100, "ufanero": 100, "bienaventuroso": 100, "regocijante de gozo": 100, "beato": 100, "biennacido": 100, "glorificado": 100
    }
  },
  {
    id: "gen-003", pack: "general",
    texto: "Municipio o ciudad de España que empiece por la letra «S»",
    ejemplo: "sot de chera",
    answers: {
      "sevilla": 10, "salamanca": 10, "santander": 10, "segovia": 10, "san sebastian": 10, "santiago de compostela": 10, "santiago": 10, "soria": 10, "donostia": 10,
      "sitges": 25, "salou": 25, "sanxenxo": 25, "santillana del mar": 25, "santillana": 25, "sotogrande": 25, "santa cruz de tenerife": 25, "santa cruz": 25, "sanlucar de barrameda": 25, "sanlucar": 25, "sagunto": 25, "san sebastian de los reyes": 25, "sanse": 25, "somo": 25, "suances": 25, "sierra nevada": 25, "sant feliu": 25, "santa coloma": 25,
      "sabadell": 45, "san fernando": 45, "santa pola": 45, "sepulveda": 45, "siguenza": 45, "sant cugat del valles": 45, "sant cugat": 45, "santurtzi": 45, "sestao": 45, "san javier": 45, "san vicente del raspeig": 45, "san lorenzo de el escorial": 45, "san lorenzo": 45, "segorbe": 45, "santoña": 45, "sarria": 45, "sanguesa": 45, "sallent": 45, "sant feliu de guixols": 45, "santa coloma de gramenet": 45, "sueca": 45, "sax": 45, "san pedro del pinatar": 45, "san roque": 45, "santa brigida": 45, "santa lucia de tirajana": 45, "san bartolome de tirajana": 45, "san bartolome": 45, "santa eulalia": 45, "sant antoni": 45, "sant antoni de portmany": 45, "sils": 45, "salt": 45, "sedavi": 45, "silla": 45, "son servera": 45, "santanyi": 45, "sineu": 45, "soller": 45, "ses salines": 45, "sabinanigo": 45, "sahagun": 45, "salas": 45,
      "sos del rey catolico": 65, "sotillo de la adrada": 65, "santo domingo de silos": 65, "santo domingo de la calzada": 65, "simancas": 65, "sort": 65, "san cristobal de la laguna": 65, "la laguna": 65, "san juan de aznalfarache": 65, "san juan de alicante": 65, "san martin de la vega": 65, "san martin de valdeiglesias": 65, "san agustin del guadalix": 65, "san fernando de henares": 65, "san mateo": 65, "san esteban de gormaz": 65, "santa fe": 65, "santa comba": 65, "santiago del teide": 65, "sacedon": 65, "seseña": 65, "socuellamos": 65, "sonseca": 65, "soto del real": 65, "san vicente de la barquera": 65, "san vicente de alcantara": 65, "sariñena": 65, "setenil de las bodegas": 65, "setenil": 65, "somiedo": 65, "suria": 65, "sallent de gallego": 65, "sasamon": 65, "sant carles de la rapita": 65, "la rapita": 65,
      "serradilla": 85, "serrejon": 85, "sot de chera": 85, "senija": 85, "siete iglesias de trabancos": 85, "sotillo de la ribera": 85, "sopeira": 85, "sotres": 85, "samaniego": 85, "santurde": 85, "santurdejo": 85, "santorcaz": 85, "santa colomba de somoza": 85, "santa maria del campo": 85, "santa maria de cayon": 85, "santibañez de la sierra": 85, "santibañez de vidriales": 85, "santed": 85, "saravillo": 85, "sariego": 85, "sartaguda": 85, "sesma": 85, "sotorribas": 85, "sobradel": 85, "sobradiel": 85, "solsona": 85, "soses": 85, "suflia": 85,
      "sot de ferrer": 100, "senes de alcubierre": 100, "senes": 100, "seron": 100, "salillas": 100, "salillas de jalon": 100, "salvatierra de esca": 100, "santa cruz de moya": 100, "san vicente de arevalo": 100, "sariegos": 100
    }
  },
  {
    id: "gen-004", pack: "general",
    texto: "Equipo de fútbol español que haya jugado al menos una temporada en Primera División",
    ejemplo: "atletico tetuan",
    answers: {
      "real madrid": 10, "madrid": 10, "barcelona": 10, "fc barcelona": 10, "barca": 10, "atletico de madrid": 10, "atletico": 10, "atleti": 10, "sevilla": 10, "sevilla fc": 10, "valencia": 10, "valencia cf": 10, "athletic club": 10, "athletic": 10, "athletic de bilbao": 10, "bilbao": 10, "real sociedad": 10, "la real": 10, "betis": 10, "real betis": 10, "real betis balompie": 10, "villarreal": 10, "villarreal cf": 10,
      "hercules": 25, "hercules cf": 25, "xerez": 25, "xerez cd": 25, "numancia": 25, "cd numancia": 25, "tenerife": 25, "cd tenerife": 25, "recreativo": 25, "recreativo de huelva": 25, "recre": 25, "compostela": 25, "sd compostela": 25, "real union": 25, "real union de irun": 25, "irun": 25, "eibar": 25, "sd eibar": 25, "leganes": 25, "cd leganes": 25, "girona": 25, "girona fc": 25, "huesca": 25, "sd huesca": 25,
      "celta": 45, "celta de vigo": 45, "rc celta": 45, "valladolid": 45, "real valladolid": 45, "pucela": 45, "deportivo": 45, "deportivo de la coruña": 45, "depor": 45, "rc deportivo": 45, "malaga": 45, "malaga cf": 45, "cd malaga": 45, "osasuna": 45, "ca osasuna": 45, "mallorca": 45, "rcd mallorca": 45, "getafe": 45, "getafe cf": 45, "levante": 45, "levante ud": 45, "alaves": 45, "deportivo alaves": 45, "cadiz": 45, "cadiz cf": 45, "espanyol": 45, "rcd espanyol": 45, "español": 45, "rcd español": 45, "rayo vallecano": 45, "rayo": 45, "vallecas": 45, "real zaragoza": 45, "zaragoza": 45, "sporting de gijon": 45, "sporting": 45, "gijon": 45, "oviedo": 45, "real oviedo": 45, "racing de santander": 45, "racing": 45, "granada": 45, "granada cf": 45, "elche": 45, "elche cf": 45, "las palmas": 45, "ud las palmas": 45,
      "almeria": 65, "ud almeria": 65, "ad almeria": 65, "murcia": 65, "real murcia": 65, "albacete": 65, "albacete balompie": 65, "salamanca": 65, "ud salamanca": 65, "castellon": 65, "cd castellon": 65, "lleida": 65, "ue lleida": 65, "cordoba": 65, "cordoba cf": 65, "logrones": 65, "cd logrones": 65, "burgos": 65, "burgos cf": 65, "real burgos": 65, "sabadell": 65, "ce sabadell": 65, "pontevedra": 65, "pontevedra cf": 65,
      "extremadura": 85, "cf extremadura": 85, "gimnastic de tarragona": 85, "nastic": 85, "nastic de tarragona": 85, "real jaen": 85, "jaen": 85, "arenas club": 85, "arenas de getxo": 85, "arenas": 85, "merida": 85, "cp merida": 85, "cultural leonesa": 85, "cultural": 85, "la cultu": 85, "alcoyano": 85, "cd alcoyano": 85,
      "atletico tetuan": 100, "tetuan": 100, "condal": 100, "cd condal": 100, "europa": 100, "ce europa": 100, "racing de madrid": 100, "españa de barcelona": 100
    }
  },
  {
    id: "gen-005", pack: "general",
    texto: "Marca de automóviles (desde generalistas hasta artesanales o desaparecidas)",
    ejemplo: "hurtan",
    easterEgg: "delorean",
    answers: {
      "seat": 10, "renault": 10, "ford": 10, "volkswagen": 10, "vw": 10, "toyota": 10, "bmw": 10, "mercedes": 10, "mercedes benz": 10, "audi": 10, "peugeot": 10, "citroen": 10, "opel": 10, "fiat": 10, "nissan": 10, "hyundai": 10, "kia": 10, "honda": 10,
      "ferrari": 25, "lamborghini": 25, "tesla": 25, "rolls royce": 25, "bentley": 25, "porsche": 25, "bugatti": 25, "mclaren": 25, "maserati": 25, "aston martin": 25, "delorean": 25, "lotus": 25,
      "skoda": 45, "dacia": 45, "mazda": 45, "suzuki": 45, "mitsubishi": 45, "volvo": 45, "jeep": 45, "land rover": 45, "mini": 45, "smart": 45, "alfa romeo": 45, "lancia": 45, "chevrolet": 45, "cupra": 45, "lexus": 45, "subaru": 45, "jaguar": 45, "saab": 45, "chrysler": 45, "dodge": 45, "daewoo": 45, "abarth": 45, "alpine": 45, "ds": 45, "infiniti": 45,
      "byd": 65, "omoda": 65, "jaecoo": 65, "xiaomi": 65, "mg": 65, "morris garages": 65, "polestar": 65, "lynk and co": 65, "lynk & co": 65, "zeekr": 65, "xpeng": 65, "nio": 65, "seres": 65, "leapmotor": 65, "dr": 65, "dfsk": 65, "maxus": 65, "aiways": 65, "voyah": 65, "rover": 65, "ssangyong": 65, "kgm": 65, "daihatsu": 65, "isuzu": 65, "lada": 65, "trabant": 65, "cadillac": 65, "hummer": 65, "pontiac": 65, "simca": 65, "talbot": 65, "genesis": 65,
      "pegaso": 85, "santana": 85, "barreiros": 85, "hispano suiza": 85, "dkw": 85, "tvr": 85, "morgan": 85, "tata": 85, "mahindra": 85, "wiesmann": 85, "spyker": 85, "koenigsegg": 85, "pagani": 85, "de tomaso": 85, "borgward": 85, "tatra": 85, "zastava": 85, "yugo": 85, "moskvich": 85, "wartburg": 85, "plymouth": 85, "oldsmobile": 85, "buick": 85, "autobianchi": 85, "caterham": 85, "ariel": 85, "ssc": 85, "ssc north america": 85,
      "hurtan": 100, "gta spano": 100, "spano": 100, "tramontana": 100, "ebro": 100, "aixam": 100, "ligier": 100, "donkervoort": 100, "rimac": 100, "panoz": 100, "ginetta": 100, "comarth": 100, "microcar": 100, "bac": 100, "gumpert": 100, "noble": 100, "icona": 100
    }
  },
  {
    id: "gen-006", pack: "general",
    texto: "Película española ganadora del Goya a Mejor Película o muy taquillera",
    ejemplo: "arrebato",
    answers: {
      "ocho apellidos vascos": 10, "ocho apellidos catalanes": 10, "mar adentro": 10, "el orfanato": 10, "orfanato": 10, "los otros": 10, "volver": 10, "todo sobre mi madre": 10, "campeones": 10, "torrente": 10, "torrente el brazo tonto de la ley": 10, "el brazo tonto de la ley": 10, "lo imposible": 10, "la sociedad de la nieve": 10, "el laberinto del fauno": 10, "padre no hay mas que uno": 10,
      "viridiana": 25, "el espiritu de la colmena": 25, "espiritu de la colmena": 25, "el verdugo": 25, "verdugo": 25, "bienvenido mister marshall": 25, "calle mayor": 25, "placido": 25, "la gran familia": 25, "gran familia": 25, "el pisito": 25, "pisito": 25, "amanece que no es poco": 25, "el hoyo": 25, "celda 211": 25, "rec": 25, "tesis": 25, "el dia de la bestia": 25, "airbag": 25, "mujeres al borde de un ataque de nervios": 25, "torrente presidente": 25,
      "los lunes al sol": 45, "belle epoque": 45, "la lengua de las mariposas": 45, "lengua de las mariposas": 45, "los santos inocentes": 45, "un monstruo viene a verme": 45, "abre los ojos": 45, "las niñas": 45, "dolor y gloria": 45, "el buen patron": 45, "buen patron": 45, "as bestas": 45, "hable con ella": 45, "ay carmela": 45, "solas": 45, "la isla minima": 45, "campeonex": 45, "a tres metros sobre el cielo": 45, "tengo ganas de ti": 45, "palmeras en la nieve": 45, "el niño": 45, "el cuerpo": 45, "contratiempo": 45, "padre no hay mas que uno 2": 45, "padre no hay mas que uno 3": 45, "padre no hay mas que uno 4": 45, "alatriste": 45, "el bola": 45, "te doy mis ojos": 45, "la vida secreta de las palabras": 45, "la soledad": 45, "camino": 45, "no habra paz para los malvados": 45, "blancanieves": 45, "truman": 45, "tarde para la ira": 45, "la libreria": 45,
      "pa negre": 65, "pan negro": 65, "el bosque animado": 65, "el sueño del mono loco": 65, "amantes": 65, "todos a la carcel": 65, "dias contados": 65, "nadie hablara de nosotras cuando hayamos muerto": 65, "la buena estrella": 65, "la niña de tus ojos": 65, "vivir es facil con los ojos cerrados": 65, "cinco lobitos": 65, "20000 especies de abejas": 65, "mientras dure la guerra": 65, "magical girl": 65, "el secreto de sus ojos": 65, "agora": 65, "los ojos de julia": 65, "durante la tormenta": 65, "bajocero": 65, "hogar": 65, "toc toc": 65, "perfectos desconocidos": 65, "perdiendo el norte": 65, "las brujas de zugarramurdi": 65, "balada triste de trompeta": 65, "rec 2": 65, "way down": 65, "torrente 2": 65, "torrente 3": 65, "torrente 4": 65, "azuloscurocasinegro": 65, "kika": 65,
      "el viaje a ninguna parte": 85, "furtivos": 85, "la caza": 85, "cria cuervos": 85, "el crimen de cuenca": 85, "crimen de cuenca": 85, "el espinazo del diablo": 85, "el sur": 85, "tristana": 85, "el pico": 85, "pico": 85, "la tia tula": 85, "tia tula": 85, "la escopeta nacional": 85, "deprisa deprisa": 85, "la colmena": 85, "jamon jamon": 85, "los amantes del circulo polar": 85, "lucia y el sexo": 85, "el crack": 85, "barrio": 85, "la piel que habito": 85,
      "arrebato": 100, "surcos": 100, "la aldea maldita": 100, "aldea maldita": 100, "la cabina": 100, "cabina": 100, "los cronocrimenes": 100, "cronocrimenes": 100, "muerte de un ciclista": 100, "que he hecho yo para merecer esto": 100, "historias de la radio": 100
    }
  },
  {
    id: "gen-007", pack: "general",
    texto: "Fruta o verdura de color verde",
    ejemplo: "salicornia",
    answers: {
      "lechuga": 10, "pepino": 10, "kiwi": 10, "aguacate": 10, "brocoli": 10, "espinacas": 10, "espinaca": 10, "guisantes": 10, "guisante": 10, "calabacin": 10, "judias verdes": 10, "judia verde": 10, "pimiento verde": 10, "manzana verde": 10, "lima": 10, "pera": 10, "uva": 10, "uvas": 10, "melon": 10, "alcachofa": 10, "acelga": 10, "acelgas": 10,
      "aceituna": 25, "aceitunas": 25, "aceituna verde": 25, "pistacho": 25, "pistachos": 25, "perejil": 25, "albahaca": 25, "cilantro": 25, "menta": 25, "hierbabuena": 25, "aloe vera": 25, "tomate verde": 25, "limon verde": 25, "platano verde": 25, "wasabi": 25, "alcaparras": 25, "alcaparra": 25, "pepinillo": 25, "pepinillos": 25, "cebollino": 25, "eneldo": 25, "oregano": 25, "romero": 25, "tomillo": 25, "laurel": 25, "te verde": 25,
      "col": 45, "repollo": 45, "berza": 45, "apio": 45, "puerro": 45, "puerros": 45, "esparrago": 45, "esparragos": 45, "esparrago verde": 45, "esparragos verdes": 45, "coles de bruselas": 45, "canonigos": 45, "rucula": 45, "endibia": 45, "escarola": 45, "habas": 45, "haba": 45, "habitas": 45, "pimiento de padron": 45, "pimientos de padron": 45, "chirimoya": 45, "pimiento italiano": 45, "vainas": 45, "bimi": 45, "uva verde": 45, "uvas verdes": 45, "pera conferencia": 45, "granny smith": 45, "melon piel de sapo": 45,
      "kale": 65, "col rizada": 65, "pak choi": 65, "edamame": 65, "tirabeques": 65, "tirabeque": 65, "grelos": 65, "nabizas": 65, "borraja": 65, "cardo": 65, "guayaba": 65, "ciruela claudia": 65, "ciruela verde": 65, "romanesco": 65, "chayote": 65, "nopal": 65, "okra": 65, "berros": 65, "berro": 65, "feijoa": 65, "verdolaga": 65, "col china": 65, "judia boby": 65, "judia perona": 65, "espinaca baby": 65, "achicoria": 65, "hinojo": 65, "calabaza verde": 65,
      "diente de leon": 85, "ortiga": 85, "melon amargo": 85, "tomatillo": 85, "tomatillo verde": 85, "colinabo": 85, "guanabana": 85, "carambola verde": 85, "papaya verde": 85, "mango verde": 85, "higo verde": 85, "breva verde": 85, "tatsoi": 85, "mizuna": 85, "choy sum": 85, "quiabo": 85, "quimbombo": 85, "alga nori": 85, "alga wakame": 85, "salvia": 85,
      "salicornia": 100, "esparrago de mar": 100, "lima kaffir": 100, "alholva": 100, "luffa": 100, "chayota": 100, "espirulina": 100, "chlorella": 100, "pepino amargo": 100
    }
  },
  {
    id: "gen-008", pack: "general",
    texto: "Cadena de supermercados o hipermercados que opere o haya operado en España",
    ejemplo: "valvi",
    answers: {
      "mercadona": 10, "carrefour": 10, "lidl": 10, "dia": 10, "alcampo": 10, "eroski": 10, "aldi": 10, "el corte ingles": 10, "corte ingles": 10, "hipercor": 10, "consum": 10, "caprabo": 10, "supercor": 10, "carrefour market": 10, "carrefour express": 10, "dia market": 10, "dia maxi": 10, "la plaza de dia": 10,
      "amazon fresh": 25, "amazon": 25, "costco": 25, "walmart": 25, "tesco": 25, "ikea": 25, "leroy merlin": 25, "hacendado": 25, "bazar chino": 25, "ultramarinos": 25, "kiwoko": 25, "primark": 25, "decathlon": 25, "media markt": 25, "mediamarkt": 25, "shein": 25, "temu": 25, "aliexpress": 25, "zara": 25, "tiger": 25, "flying tiger": 25, "fnac": 25, "todo a cien": 25,
      "bonpreu": 45, "esclat": 45, "bonarea": 45, "condis": 45, "ahorramas": 45, "gadis": 45, "masymas": 45, "coviran": 45, "family cash": 45, "froiz": 45, "supersol": 45, "simply": 45, "simply market": 45, "auchan": 45, "champion": 45, "pryca": 45, "continente": 45, "dialprix": 45, "eroski city": 45, "makro": 45, "spar": 45, "eurospar": 45, "interspar": 45, "despar": 45, "supeco": 45, "cash fresh": 45, "hiper planet": 45, "e leclerc": 45, "leclerc": 45, "hiperber": 45, "la sirena": 45, "bofrost": 45,
      "bm": 65, "bm supermercados": 65, "alimerka": 65, "lupa": 65, "hiperdino": 65, "superdino": 65, "dinosol": 65, "cash lepe": 65, "plusfresc": 65, "sorli": 65, "sorli discau": 65, "hiper usera": 65, "el arbol": 65, "maxcoop": 65, "coaliment": 65, "udaco": 65, "gama": 65, "claudio": 65, "aqui e agora": 65, "spar express": 65, "miquel alimentacio": 65, "gmcash": 65, "gros mercat": 65, "comerco": 65, "cash diplo": 65, "cuevas": 65, "plenosol": 65, "congelados 5 oceanos": 65, "cinco oceanos": 65, "tu trebol": 65, "sabeco": 65, "simago": 65, "docks": 65, "promodes": 65,
      "supermercados unide": 85, "unide": 85, "unide market": 85, "aprop": 85, "galerias preciados": 85, "sepu": 85, "cepsa carrefour": 85, "repsol on the run": 85, "disa shop": 85, "spar kanarias": 85, "granbi": 85, "cencosu": 85, "spar gran canaria": 85, "spar tenerife": 85, "vips mart": 85, "opencor": 85, "7 eleven": 85, "seven eleven": 85, "novavenda": 85, "jespac": 85, "deza": 85, "deza calidad": 85, "alsara": 85, "supermercados el jamon": 85, "el jamon": 85, "supermercados dani": 85, "dani": 85,
      "valvi": 100, "gigante": 100, "super sol": 100, "maxi dia": 100, "ultramarinos cano": 100, "supermercados marcial": 100, "marcial": 100, "cordobes": 100, "aramburu": 100, "hiper manacor": 100, "agrupcash": 100, "unagras": 100, "super alcazar": 100
    }
  },
  {
    id: "gen-009", pack: "general",
    texto: "Videojuego lanzado originalmente para PlayStation 2 o PC en los años 2000",
    ejemplo: "praetorians",
    answers: {
      "gta san andreas": 10, "san andreas": 10, "gta vice city": 10, "vice city": 10, "gta iii": 10, "gta 3": 10, "pro evolution soccer": 10, "pes": 10, "fifa": 10, "los sims": 10, "the sims": 10, "los sims 2": 10, "god of war": 10, "god of war 2": 10, "world of warcraft": 10, "wow": 10, "counter strike": 10, "half life 2": 10, "need for speed underground": 10, "nfs underground": 10, "need for speed most wanted": 10, "gran turismo 4": 10, "gt4": 10,
      "minecraft": 25, "portal": 25, "league of legends": 25, "lol": 25, "garrys mod": 25, "runescape": 25, "bioshock": 25, "left 4 dead": 25, "dota": 25, "skyrim": 25, "fortnite": 25, "roblox": 25, "habbo": 25, "ikariam": 25, "ogame": 25, "travian": 25, "tibia": 25, "mu online": 25, "maple story": 25,
      "call of duty": 45, "call of duty 4": 45, "cod 4": 45, "metal gear solid 2": 45, "mgs2": 45, "metal gear solid 3": 45, "snake eater": 45, "kingdom hearts": 45, "kingdom hearts 2": 45, "shadow of the colossus": 45, "ico": 45, "final fantasy x": 45, "ffx": 45, "final fantasy xii": 45, "ffxii": 45, "devil may cry": 45, "devil may cry 3": 45, "gran turismo 3": 45, "silent hill 2": 45, "ratchet and clank": 45, "jak and daxter": 45, "sly cooper": 45, "max payne": 45, "deus ex": 45, "doom 3": 45, "far cry": 45, "age of empires iii": 45, "warcraft iii": 45, "frozen throne": 45, "diablo ii": 45, "morrowind": 45, "oblivion": 45, "resident evil 4": 45, "re4": 45, "guitar hero": 45, "singstar": 45, "buzz": 45, "tekken 5": 45, "dragon ball z budokai tenkaichi 3": 45, "tenkaichi 3": 45,
      "okami": 65, "bully": 65, "tony hawk pro skater 3": 65, "rome total war": 65, "civilization iv": 65, "battlefield 1942": 65, "fear": 65, "empire earth": 65, "la fuga de monkey island": 65, "prince of persia las arenas del tiempo": 65, "mafia": 65, "gothic": 65, "stalker": 65, "vampire bloodlines": 65, "flatout 2": 65, "ssx tricky": 65, "splinter cell": 65, "splinter cell chaos theory": 65, "time crisis 2": 65, "killzone": 65, "dark cloud": 65, "black": 65, "destroy all humans": 65, "manhunt": 65, "timesplitters 2": 65, "mercenaries": 65,
      "commandos 2": 85, "runaway": 85, "psychonauts": 85, "katamari damacy": 85, "rez": 85, "fahrenheit": 85, "silent hill 3": 85, "arcanum": 85, "no one lives forever": 85, "sacred": 85, "patrician iii": 85, "port royale": 85, "imperivm": 85, "simcity 4": 85, "crysis": 85, "postal 2": 85, "trackmania": 85,
      "praetorians": 100, "imperial glory": 100, "blade edge of darkness": 100, "severance blade of darkness": 100, "mortadelo y filemon": 100, "fallout tactics": 100, "pathologic": 100, "torrente el juego": 100, "the movies": 100, "giants citizen kabuto": 100, "sacrifice": 100, "project zero": 100, "forbidden siren": 100, "haunting ground": 100, "rule of rose": 100
    }
  },
  {
    id: "gen-010", pack: "general",
    texto: "País soberano de Europa o Asia",
    ejemplo: "timor oriental",
    easterEgg: "liechtenstein",
    answers: {
      "españa": 10, "francia": 10, "italia": 10, "alemania": 10, "portugal": 10, "reino unido": 10, "inglaterra": 10, "gran bretaña": 10, "china": 10, "japon": 10, "rusia": 10, "india": 10, "grecia": 10, "turquia": 10,
      "andorra": 25, "monaco": 25, "vaticano": 25, "san marino": 25, "liechtenstein": 25, "malta": 25, "luxemburgo": 25, "gibraltar": 25, "escocia": 25, "gales": 25, "kosovo": 25, "taiwan": 25, "hong kong": 25, "macao": 25, "palestina": 25, "groenlandia": 25, "islas feroe": 25, "transnistria": 25, "curazao": 25,
      "polonia": 45, "suecia": 45, "noruega": 45, "finlandia": 45, "dinamarca": 45, "holanda": 45, "paises bajos": 45, "belgica": 45, "suiza": 45, "austria": 45, "irlanda": 45, "ucrania": 45, "corea del sur": 45, "corea del norte": 45, "tailandia": 45, "vietnam": 45, "indonesia": 45, "filipinas": 45, "arabia saudi": 45, "iran": 45, "irak": 45, "israel": 45, "pakistan": 45, "afganistan": 45, "mongolia": 45, "nepal": 45, "hungria": 45, "rumania": 45, "bulgaria": 45, "serbia": 45, "croacia": 45, "eslovenia": 45, "eslovaquia": 45, "chequia": 45, "republica checa": 45, "singapur": 45, "malasia": 45,
      "lituania": 65, "letonia": 65, "estonia": 65, "bielorrusia": 65, "moldavia": 65, "albania": 65, "macedonia": 65, "macedonia del norte": 65, "bosnia": 65, "montenegro": 65, "islandia": 65, "chipre": 65, "georgia": 65, "armenia": 65, "azerbaiyan": 65, "kazajistan": 65, "uzbekistan": 65, "camboya": 65, "laos": 65, "myanmar": 65, "birmania": 65, "sri lanka": 65, "bangladesh": 65, "jordania": 65, "libano": 65, "siria": 65, "kuwait": 65, "catar": 65, "qatar": 65, "emiratos arabes unidos": 65, "oman": 65, "yemen": 65, "maldivas": 65, "brunei": 65, "butan": 65,
      "kirguistan": 85, "tayikistan": 85, "turkmenistan": 85, "bahrein": 85, "timor oriental": 85, "timor leste": 85, "bosnia y herzegovina": 85, "bosnia herzegovina": 85, "ceylan": 85, "persia": 85, "siam": 85, "checoslovaquia": 85, "yugoslavia": 85, "urss": 85, "union sovietica": 85, "corea": 85,
      "kazajstan": 100, "kirguizia": 100, "kirguizistan": 100, "turcomanistan": 100, "abjasia": 100, "osetia del sur": 100, "nagorno karabaj": 100, "artsaj": 100, "republica turca del norte de chipre": 100, "chipre del norte": 100, "orden de malta": 100, "sealand": 100
    }
  },
  {
    id: "gen-011", pack: "general",
    texto: "Instrumento musical de viento o percusión",
    ejemplo: "heckelphone",
    answers: {
      "flauta": 10, "trompeta": 10, "bateria": 10, "tambor": 10, "saxofon": 10, "clarinete": 10, "trombon": 10, "gaita": 10, "pandereta": 10, "castañuelas": 10, "xilofono": 10, "triangulo": 10, "timbal": 10, "bombo": 10, "platillos": 10, "caja": 10, "saxo": 10,
      "armonica": 25, "kazoo": 25, "silbato": 25, "vuvuzela": 25, "didgeridoo": 25, "didyeridu": 25, "palmas": 25, "cajon": 25, "cajon flamenco": 25, "maracas": 25, "cascabeles": 25, "cucharas": 25, "cencerro": 25, "bocina": 25, "pito": 25, "matraca": 25, "almirez": 25, "botella de anis": 25,
      "oboe": 45, "fagot": 45, "tuba": 45, "corneta": 45, "flautin": 45, "piccolo": 45, "ocarina": 45, "dulzaina": 45, "chirimia": 45, "txistu": 45, "bongos": 45, "bongo": 45, "congas": 45, "conga": 45, "tambora": 45, "campanas": 45, "pandero": 45, "redoblante": 45, "gong": 45, "guiro": 45, "claves": 45, "marimba": 45, "vibrafono": 45, "trompa": 45, "trompa francesa": 45, "corno frances": 45, "bugle": 45, "zambomba": 45, "carraca": 45, "djembe": 45, "darbuka": 45, "tabla": 45, "shaker": 45, "cabasa": 45,
      "gralla": 65, "tamboril": 65, "fliscorno": 65, "corno ingles": 65, "clarinete bajo": 65, "contrafagot": 65, "cornamusa": 65, "quena": 65, "zampona": 65, "flauta de pan": 65, "siku": 65, "steel drum": 65, "handpan": 65, "hang": 65, "cajita china": 65, "cortinilla": 65, "pandero cuadrado": 65, "adufe": 65, "bendir": 65, "udu": 65, "berimbau": 65, "cuica": 65, "pandeiro": 65, "flauta travesera": 65, "flauta dulce": 65, "bombardino": 65, "sousafon": 65, "melodica": 65, "flauta de embolo": 65,
      "alboka": 85, "txalaparta": 85, "sistro": 85, "flabiol": 85, "bombarda": 85, "tenora": 85, "tible": 85, "shakuhachi": 85, "duduk": 85, "bansuri": 85, "zurna": 85, "ney": 85, "kaval": 85, "daf": 85, "riq": 85, "bodhran": 85, "surdo": 85, "agogo": 85, "caxixi": 85, "flexatono": 85, "vibraslap": 85, "glockenspiel": 85, "celesta": 85,
      "ophicleide": 100, "oficleido": 100, "serpenton": 100, "crumhorn": 100, "cromorno": 100, "rauschpfeife": 100, "heckelphone": 100, "heckelfon": 100, "sarrusofono": 100, "bullroarer": 100, "alphorn": 100, "trompa de los alpes": 100, "carnyx": 100, "chalumeau": 100, "suona": 100, "hulusi": 100, "pututu": 100
    }
  },
  {
    id: "gen-012", pack: "general",
    texto: "Sinónimo en español de «rápido»",
    ejemplo: "aligero",
    answers: {
      "veloz": 10, "ligero": 10, "agil": 10, "raudo": 10, "pronto": 10, "instantaneo": 10, "acelerado": 10, "urgente": 10, "inmediato": 10, "apresurado": 10,
      "flash": 25, "fast": 25, "rayo": 25, "relampago": 25, "cohete": 25, "turbo": 25, "speedy": 25, "bala": 25, "express": 25, "a toda pastilla": 25, "a toda hostia": 25, "a toda leche": 25, "echando leches": 25, "a toda mecha": 25, "a to trapo": 25, "cagando leches": 25, "pitando": 25, "a fuego": 25, "enchufado": 25, "a saco": 25, "a escape": 25, "supersico": 25, "ultrasonico": 25, "en un plis": 25, "en un santiamen": 25, "en un segundo": 25, "en un parpadeo": 25, "como una flecha": 25, "como un rayo": 25, "como alma que lleva el diablo": 25,
      "presto": 45, "vertiginoso": 45, "fugaz": 45, "diligente": 45, "dinamico": 45, "activo": 45, "prontamente": 45, "velocisimo": 45, "ligerisimo": 45, "rapidisimo": 45, "vivaz": 45, "alado": 45, "presuroso": 45, "precipitado": 45, "apremiante": 45, "celere": 45, "expedito": 45, "expeditivo": 45, "fulgurante": 45, "fulminante": 45, "instantaneamente": 45, "prontisimo": 45, "disparado": 45, "embalado": 45, "raudamente": 45, "velozmente": 45, "desbocado": 45, "lanzado": 45, "desatado": 45, "atropellado": 45, "rauda": 45, "prontitud": 45, "de inmediato": 45, "sobre la marcha": 45,
      "volandero": 65, "tempestivo": 65, "perentorio": 65, "acuciante": 65, "raudisimo": 65, "diligentisimo": 65, "fugacisimo": 65, "apresuradisimo": 65, "vertiginosamente": 65, "expeditamente": 65, "aceleradisimo": 65, "apremiantisimo": 65, "flechado": 65, "arrebatado": 65, "subitaneo": 65, "subito": 65, "imprevisto": 65, "meteorico": 65, "fulmineo": 65, "impetuoso": 65, "presurosisimo": 65, "expeditisimo": 65,
      "volatin": 85, "alipede": 85, "velivolo": 85, "cursorio": 85, "aliparo": 85, "arreado": 85, "zumbando": 85, "arreando": 85, "a mata caballo": 85, "a matacaballo": 85, "velocisimamente": 85, "ligerisimamente": 85, "rapidisamente": 85, "aceleradamente": 85, "presurosamente": 85, "urgentemente": 85, "inmediatamente": 85,
      "aligero": 100, "celerrimo": 100, "desalado": 100, "ventiscoso": 100, "celeridad": 100, "taquigrafo": 100, "velocitativo": 100, "correnton": 100, "velocitado": 100, "alipedo": 100, "celerrimamente": 100
    }
  },
  {
    id: "gen-013", pack: "general",
    texto: "Marca de cerveza (nacional o de importación)",
    ejemplo: "cisk",
    answers: {
      "mahou": 10, "estrella galicia": 10, "cruzcampo": 10, "san miguel": 10, "heineken": 10, "estrella damm": 10, "damm": 10, "budweiser": 10, "corona": 10, "coronita": 10, "amstel": 10, "alhambra": 10, "voll damm": 10, "guinness": 10, "desperados": 10, "ambar": 10,
      "chimay": 25, "delirium": 25, "delirium tremens": 25, "duvel": 25, "leffe": 25, "hoegaarden": 25, "orval": 25, "westvleteren": 25, "rochefort": 25, "maredsous": 25, "steinburg": 25, "aurum": 25, "argus": 25, "karlsquell": 25, "holbrand": 25, "finkbrau": 25, "perlenbacher": 25,
      "5 estrellas": 45, "mahou 5 estrellas": 45, "victoria": 45, "keler": 45, "moritz": 45, "alcazar": 45, "turia": 45, "aguila": 45, "el aguila": 45, "el aguila sin filtrar": 45, "carlsberg": 45, "stella artois": 45, "paulaner": 45, "erdinger": 45, "franziskaner": 45, "warsteiner": 45, "becks": 45, "tuborg": 45, "peroni": 45, "birra moretti": 45, "nastro azzurro": 45, "estrella levante": 45, "levante": 45, "dorada": 45, "tropical": 45, "mahou maestra": 45, "san miguel 0 0": 45, "estrella galicia 1906": 45, "red vintage": 45, "alhambra reserva 1925": 45, "alhambra 1925": 45, "free damm": 45, "daura": 45, "inedit": 45, "kronenbourg": 45, "kronenbourg 1664": 45, "bud light": 45, "coors": 45, "miller": 45, "quilmes": 45, "brahma": 45, "cusquena": 45, "club colombia": 45,
      "pilsner urquell": 65, "kozel": 65, "staropramen": 65, "budvar": 65, "lowenbrau": 65, "grolsch": 65, "kirin": 65, "asahi": 65, "sapporo": 65, "tiger": 65, "singha": 65, "chang": 65, "tsingtao": 65, "cobra": 65, "kingfisher": 65, "tecate": 65, "modelo": 65, "pacifico": 65, "sol": 65, "negra modelo": 65, "xx": 65, "red stripe": 65, "la zaragozana": 65, "ambar 1900": 65, "la virgen": 65, "arriaca": 65, "dougalls": 65, "la sagra": 65, "basqueland": 65, "garage beer": 65, "naparbier": 65, "tyris": 65,
      "mica": 85, "domus": 85, "yria": 85, "westmalle": 85, "trappe": 85, "achel": 85, "efes": 85, "mythos": 85, "pelforth": 85, "tusker": 85, "gulden draak": 85, "kwak": 85, "tripel karmeliet": 85, "brewdog": 85, "sierra nevada": 85, "goose island": 85, "weihenstephaner": 85, "schneider weisse": 85,
      "cisk": 100, "fix": 100, "ceres": 100, "hite": 100, "kaiser": 100, "la socarrada": 100, "caleya": 100, "sevebrau": 100, "califa": 100, "cerveza califa": 100, "ballut": 100, "bleder": 100, "espiga": 100, "bidassoa": 100, "trooper": 100
    }
  },
  {
    id: "gen-014", pack: "general",
    texto: "Animal marino que no sea un pez",
    ejemplo: "pennatula",
    answers: {
      "delfin": 10, "ballena": 10, "pulpo": 10, "calamar": 10, "medusa": 10, "tortuga marina": 10, "tortuga": 10, "cangrejo": 10, "langosta": 10, "foca": 10, "estrella de mar": 10, "erizo de mar": 10, "orca": 10,
      "pinguino": 25, "gaviota": 25, "pelicano": 25, "cormoran": 25, "albatros": 25, "nutria": 25, "nutria marina": 25, "pato marino": 25, "frailecillo": 25, "alca": 25, "pardela": 25, "petrel": 25, "piquero": 25, "oso polar": 25, "rata de agua": 25, "castor marino": 25,
      "morsa": 45, "leon marino": 45, "lobo marino": 45, "manati": 45, "dugongo": 45, "narval": 45, "beluga": 45, "cachalote": 45, "rorcual": 45, "ballena azul": 45, "ballena jorobada": 45, "yubarta": 45, "almeja": 45, "mejillon": 45, "ostra": 45, "vieira": 45, "berberecho": 45, "navaja": 45, "percebe": 45, "gamba": 45, "langostino": 45, "camaron": 45, "cigala": 45, "bogavante": 45, "centollo": 45, "necora": 45, "buey de mar": 45, "anemona": 45, "coral": 45, "esponja": 45, "esponja marina": 45, "sepia": 45, "jibia": 45, "erizo": 45, "erizos": 45, "calamar gigante": 45, "calamar colosal": 45,
      "nautilo": 65, "nautilus": 65, "cangrejo ermitano": 65, "ermitano": 65, "krill": 65, "lapa": 65, "pepino de mar": 65, "carabela portuguesa": 65, "fragata portuguesa": 65, "agua mala": 65, "avispa de mar": 65, "cubomedusa": 65, "babosa de mar": 65, "liebre de mar": 65, "caracol marino": 65, "bigaro": 65, "coquina": 65, "chirla": 65, "tellina": 65, "busano": 65, "canadilla": 65, "oreja de mar": 65, "abalon": 65, "galera": 65, "cefalopodo": 65, "calamar de pota": 65, "pota": 65, "pulpo de anillos azules": 65, "serpiente marina": 65, "iguana marina": 65, "cocodrilo marino": 65,
      "ofiura": 85, "lirio de mar": 85, "tunicado": 85, "ascidia": 85, "holoturia": 85, "gorgonia": 85, "nudibranquio": 85, "argonauta": 85, "ctenoforo": 85, "sifonoforo": 85, "salpa": 85, "medusa melena de leon": 85, "medusa huevo frito": 85, "actinia": 85, "tomate de mar": 85, "vaquita marina": 85, "marsopa": 85, "zifio": 85, "calderon": 85,
      "pennatula": 100, "pluma de mar": 100, "briozoo": 100, "quiton": 100, "escafopodo": 100, "pteropodo": 100, "pirosoma": 100, "estrella canasta": 100, "angel de mar": 100, "clione": 100, "gusano bobbit": 100, "gusano tubicola": 100, "cerdo de mar": 100, "scotoplanes": 100, "isopodo gigante": 100, "bathynomus": 100, "calamar vampiro": 100, "esponja de cristal": 100, "crinoideo": 100
    }
  },


  {
    id: "gen-015", pack: "general",
    texto: "Plato, ración o tapa típica de la gastronomía española",
    ejemplo: "cap i pota",
    answers: {
      "tortilla de patatas": 10, "tortilla española": 10, "tortilla": 10, "paella": 10, "paella valenciana": 10, "croquetas": 10, "croquetas de jamon": 10, "jamon": 10, "jamon iberico": 10, "jamon serrano": 10, "gazpacho": 10, "salmorejo": 10, "patatas bravas": 10, "bravas": 10, "cocido": 10, "cocido madrileño": 10, "calamares": 10, "calamares a la romana": 10, "ensaladilla rusa": 10, "ensaladilla": 10, "pulpo a la gallega": 10, "fabada": 10, "fabada asturiana": 10, "pimientos de padron": 10, "albondigas": 10, "huevos rotos": 10, "gambas al ajillo": 10, "pan con tomate": 10,
      "sangria": 25, "churros": 25, "churros con chocolate": 25, "tapas": 25, "pinchos": 25, "pintxos": 25, "bocadillo de calamares": 25, "bocadillo de jamon": 25, "tabla de ibericos": 25, "queso manchego": 25, "jamon de bellota": 25, "paella de marisco": 25, "paella mixta": 25, "arroz con leche": 25, "crema catalana": 25, "tarta de santiago": 25, "pincho moruno": 25, "empanadillas": 25, "chorizo": 25,
      "pisto": 45, "boquerones en vinagre": 45, "empanada gallega": 45, "fideua": 45, "arroz negro": 45, "arroz a banda": 45, "lentejas": 45, "potaje": 45, "puchero": 45, "pucheros": 45, "callos": 45, "rabo de toro": 45, "cochinillo asado": 45, "lechazo": 45, "chipirones": 45, "bacalao al pil pil": 45, "bacalao a la vizcaina": 45, "merluza a la vasca": 45, "merluza en salsa verde": 45, "caldo gallego": 45, "lacon con grelos": 45, "escalivada": 45, "calcots": 45, "pimientos rellenos": 45, "berenjenas con miel": 45, "huevos a la flamenca": 45, "migas": 45, "ajoblanco": 45, "gilda": 45, "rabas": 45, "torreznos": 45, "cachopo": 45, "serranito": 45, "flamenquin": 45, "pescaito frito": 45, "espinacas con garbanzos": 45, "pulpo a feira": 45,
      "marmitako": 65, "zarajos": 65, "atascaburras": 65, "carcamusas": 65, "duelo y quebrantos": 65, "lamprea": 65, "paparajotes": 65, "txangurro": 65, "kokotxas": 65, "alubias de tolosa": 65, "pochas": 65, "chuleton": 65, "oreja a la plancha": 65, "sobrasada": 65, "suquet de peix": 65, "arroz al horno": 65, "caracoles a la llauna": 65, "tumbet": 65, "sopa mallorquina": 65, "gurullos": 65, "papas arrugadas": 65, "mojo picon": 65, "puchero canario": 65, "ropa vieja": 65, "pestiños": 65, "judiones de la granja": 65, "bonito en escabeche": 65, "tortillitas de camarones": 65, "carrilleras": 65, "criadillas": 65, "cocido maragato": 65, "fabes con almejas": 65, "gazpachuelo": 65, 
      "sorropotun": 85, "morteruelo": 85, "ajoarriero": 85, "bacalao al ajoarriero": 85, "zorongollo": 85, "lomo de orza": 85, "pote asturiano": 85, "porrusalda": 85, "zurrukutuna": 85, "michirones": 85, "caldero murciano": 85, "frite extremeño": 85, "cojonudo": 85, "remojon granadino": 85, "pipirrana": 85, "andrajos": 85, "entresijos": 85,
      "cap i pota": 100, "carne fiesta": 100, "coca de trampo": 100, "frit mallorqui": 100, "arros brut": 100, "faves a la catalana": 100, "samfaina": 100, "potaje de berros": 100, "escaldon de gofio": 100, "ortiguillas": 100, "ajo cabañil": 100, "sangrecilla": 100, "pelotas de fraile": 100, "olla podrida": 100, "trinxat": 100, "xatonada": 100, "chanfaina": 100
    }
  },
  {
    id: "gen-016", pack: "general",
    texto: "Cadena de comida rápida o franquicia de restauración que opere en España",
    ejemplo: "burger ranch",
    answers: {
      "chilis": 25, "chili s": 25, "hooters": 25, "ruby tuesday": 25, "starbucks coffee": 25, "restaurante vips": 25, "tommy mel s": 65, "tony roma s": 65, "carl s jr": 65, "foster s hollywood": 45, "vips smart": 45, "dunkin coffee": 45, "cafe y te": 45, "cinco jotas": 45, "tea shop": 45, "llao llao": 45, "smoy": 85, "jamaica coffee shop": 100, "il padrino": 85, "panaria": 100,
      "mcdonalds": 10, "mcdonald s": 10, "mc donalds": 10, "mcdonald": 10, "burger king": 10, "bk": 10, "kfc": 10, "telepizza": 10, "dominos": 10, "domino s": 10, "dominos pizza": 10, "pizza hut": 10, "subway": 10, "starbucks": 10, "100 montaditos": 10, "cien montaditos": 10, "foster hollywood": 10, "fosters hollywood": 10, "vips": 10, "taco bell": 10, "five guys": 10, "pans and company": 10, "pans company": 10,
      "burger": 25, "hamburgueseria": 25, "pizzeria": 25, "kebab": 25, "dunkin": 25, "dunkin donuts": 25, "krispy kreme": 25, "tim hortons": 25, "wendys": 25, "wendy s": 25, "popeyes": 25, "costa coffee": 25, "hard rock cafe": 25, "planet hollywood": 25, "dennys": 25, "denny s": 25, "tgi fridays": 25, "fridays": 25, "papa johns": 25, "papa john s": 25, "little caesars": 25, "pret a manger": 25, 
      "goiko": 45, "goiko grill": 45, "rodilla": 45, "la sureña": 45, "tgb": 45, "the good burger": 45, "bacoa": 45, "vicio": 45, "fitzgerald": 45, "pomodoro": 45, "ginos": 45, "gino s": 45, "tagliatelle": 45, "la tagliatella": 45, "tagliatella": 45, "bocatta": 45, "lizarran": 45, "txapela": 65, "muerde la pasta": 65, "wok to walk": 45, "wagamama": 65, "vapiano": 65, "viena": 45, "viena capellanes": 65, "ribs": 65, "la pepita burger bar": 65, "honest greens": 45, "flax and kale": 45, "hamburguesa nostra": 65, "nostrum": 65, "la mafia se sienta a la mesa": 65, "la mafia": 65, "sbarro": 65, "tommy mels": 65, "tony romas": 65, "carls jr": 65, "fresc co": 65, "kentucky fried chicken": 45,
      "lateral": 65, "la vaca argentina": 65, "museo del jamon": 85, "fast good": 65, "pomme de pain": 65, "paul": 65, "granier": 100, "panod": 100, "cafe and te": 65, "pizza movil": 85, "la mallorquina": 100, "cantina mariachi": 85, "ten con ten": 85, "il tavolo verde": 85, "alsur cafe": 85, "home burger bar": 85, "eat out": 85, "pollo campero": 85, "sushita cafe": 100, "sushi shop": 65, "cruz blanca": 100, "wimpy": 85, "mama campo": 100, "taberna del volapie": 100, "volapie": 100, "cafe de indias": 100, "pastelerias mallorca": 100, "cerveceria 100 montaditos": 65, "cañas y tapas": 65, 
      "sagardi": 85, 
      "burger ranch": 100, 
    }
  },
  {
    id: "gen-017", pack: "general",
    texto: "Serie de televisión española (clásica o actual)",
    ejemplo: "la bola de cristal",
    answers: {
      "amar en tiempos revueltos": 45, "tiempos de guerra": 45, "bandolera": 45, "carlos rey emperador": 45, "la otra mirada": 45, "la cocinera de castamar": 45, "la templanza": 45, "alta mar": 45, "el cid": 45, "escenas de matrimonio": 45, "lleno por favor": 45, "vecinos": 45, "hermanos de leche": 45, "paraiso": 65, "la zona": 65, "vota juan": 65, "veneno": 65, "la forja de un rebelde": 100, "ellas y el sexo debil": 85, "gominolas": 85, "madres amor y vida": 65, "la fortuna": 65, "toy boy": 65, "el desorden que dejas": 65, "jaguar": 65, "sin identidad": 65, "la caza monteperdido": 65, "la caza tramuntana": 65, "el jefe": 85, "los herederos": 85, "alma": 85,
      "aqui no hay quien viva": 10, "anhqv": 10, "la que se avecina": 10, "lqsa": 10, "los serrano": 10, "cuentame": 10, "cuentame como paso": 10, "el internado": 10, "fisica o quimica": 10, "la casa de papel": 10, "aida": 10, "7 vidas": 10, "siete vidas": 10, "verano azul": 10, "medico de familia": 10, "hospital central": 10, "los hombres de paco": 10, "el barco": 10, "vis a vis": 10, "elite": 10,
      "money heist": 25, "berlin": 25, "el ministerio del tiempo": 25, "manos a la obra": 25, "antidisturbios": 25, "patria": 25, "farina": 25, "machos alfa": 25, "las chicas del cable": 25, "velvet": 25, "gran hotel": 25, "amar es para siempre": 25, "el principe": 25, "la reina del sur": 25, "el embarcadero": 25, "vivir sin permiso": 25, "la peste": 25, "la unidad": 25, "paquita salas": 25, "merli": 25, "los misterios de laura": 25, "hierro": 25,
      "malviviendo": 45, "crematorio": 45, "comisario": 45, "el comisario": 45, "policias en el corazon de la calle": 45, "periodistas": 45, "compañeros": 45, "al salir de clase": 45, "hermanos y detectives": 100, "makinavaja": 100, "los ladrones van a la oficina": 100, "los pazos de ulloa": 45, "curro jimenez": 100, "ramon y cajal": 100, "anillos de oro": 100, "turno de oficio": 100, "juncal": 100, "brigada central": 100, "el super": 45, "la pecera de eva": 45, "mis adorables vecinos": 45, "ana y los siete": 45, "el pantano": 45, "motivos personales": 45, "los protegidos": 45, "la riera": 45, "el secreto de puente viejo": 45, "puente viejo": 45, "gym tony": 100, "gran reserva": 45, "acacias 38": 45, "el accidente": 45, "mar de plastico": 45, "bajo sospecha": 45, "yo soy bea": 45, "hispania la leyenda": 45, "hispania": 45, "isabel": 45, "el tiempo entre costuras": 45, "la catedral del mar": 45, "la huella del crimen": 45, "farmacia de guardia": 45,
      "los jinetes del alba": 85, "el don de alba": 65, "el inquilino": 65, "la regenta": 85, "fortunata y jacinta": 85, "los gozos y las sombras": 85, "cañas y barro": 85, "la casa de los lios": 65, "luna negra": 85, "fuera de lugar": 85, "ay señor señor": 65, "pepa y pepe": 85, "la señora": 65, "el pueblo": 65, "estoy vivo": 65, "las aventuras del capitan alatriste": 65, "mercado central": 65, "querido maestro": 65, "chiringuito de pepe": 65, "el chiringuito de pepe": 65, "lazos de sangre": 65, 
      "la mansion de los plaza": 85, "visto y no visto": 85, "teresa de jesus": 85, 
      "la bola de cristal": 100, 
    }
  },
  {
    id: "gen-018", pack: "general",
    texto: "Objeto, herramienta o recambio que se lleva en el interior o maletero de un coche",
    ejemplo: "cortacinturones",
    answers: {
      "chaleco": 10, "chaleco reflectante": 10, "chaleco reflectante homologado": 10, "triangulos": 10, "triangulo": 10, "rueda de repuesto": 10, "rueda de recambio": 10, "gato": 10, "papeles": 10, "documentacion": 10, "seguro": 10, "baliza v16": 10, "v16": 10, "baliza": 10, "linterna": 10, "extintor": 10, "botiquin": 10, "pinzas de bateria": 10, "cables de arranque": 10, "llave de cruz": 10, "herramientas": 10,
      "maleta": 25, "maletas": 25, "equipaje": 25, "paraguas": 25, "mochila": 25, "bolsa": 25, "cinta americana": 25, "bridas": 25, "guantes": 25, "trapo": 25, "gafas de sol": 25, "gps": 25, "navegador": 25, "movil": 25, "cargador": 25, "cargador de movil": 25, "botella de agua": 25, "agua": 25, "manta": 25, "mantas": 25, "ambientador": 25, "peluche": 25, "ruedas de nieve": 25,
      "parasol": 45, "rascador de hielo": 45, "cadenas de nieve": 45, "cadenas": 45, "kit de pinchazos": 45, "spray antipinchazos": 45, "fusibles": 45, "bombillas": 45, "bombillas de repuesto": 45, "anticongelante": 45, "aceite": 45, "liquido de frenos": 45, "liquido limpiaparabrisas": 45, "compresor": 45, "inflador": 45, "bomba de aire": 45, "manometro": 45, "eslinga": 45, "cuerda de remolque": 45, "cable de remolque": 45, "barra de remolque": 45, "destornillador": 45, "destornilladores": 45, "alicates": 45, "martillo": 45, "cinta aislante": 45, "bidon de gasolina": 45, "bidon": 45, "garrafa": 45, "embudo": 45, "limpiaparabrisas": 45, "escobillas": 45, "llave inglesa": 45, "juego de llaves": 45, "llave de rueda": 45, "linterna frontal": 45,
      "llave dinamometrica": 65, "obd": 65, "escaner obd": 65, "bateria externa": 65, "arrancador de bateria": 65, "arrancador": 65, "cinchas": 65, "cinchas de carga": 65, "pala plegable": 65, "pala": 65, "alfombrillas": 65, "lona": 65, "manta termica": 65, "mantas termicas": 65, "silbato": 65, "bengalas": 65, "bengala": 65, "mechero": 65, "cerillas": 65, "cuña": 65, "calzos": 65, "cuñas": 65, "carraca": 65, "llave de vaso": 65, "llaves allen": 65, "lampara de inspeccion": 65, "frontal": 65, "luz estroboscopica": 65, "martillo rompecristales": 65, "martillo de emergencia": 65, "valvulina": 65, "pulverizador": 65, "wd 40": 65, "wd40": 65, "lubricante": 65, 
      "multimetro": 85, "tester": 85, "tester de bateria": 85, "extractor": 85, "mordaza": 85, "tablas de traccion": 85, "tablas de arena": 85, "gato hidraulico": 85, "gato de tijera": 85, "gato de botella": 85, "caballete": 85, "caballetes": 85, "alicates de presion": 85, "polimetro": 85, "llave de pipa": 85, "sirga": 85, "gancho de remolque": 85, "ojal de remolque": 85, "cierre de rueda antirrobo": 85, "tuerca antirrobo": 85,
      "cortacinturones": 100, "cortacinturon": 100, "cizalla": 100, "extractor de pernos": 100, "bomba de vacio": 100, "kit de distribucion": 100, "calibre": 100, "pie de rey": 100, "calibrador": 100, "galga": 100, "galgas": 100, "bomba de achique": 100
    }
  },
  {
    id: "gen-019", pack: "general",
    texto: "Dulce, bollería industrial, galleta o snack de quiosco vendido en España",
    ejemplo: "gusiluz",
    easterEgg: "mantecado",
    answers: {
      "donuts": 10, "donut": 10, "bollycao": 10, "phoskitos": 10, "pantera rosa": 10, "tigreton": 10, "bony": 10, "filipinos": 10, "conguitos": 10, "oreo": 10, "principe": 10, "maria": 10, "galletas maria": 10, "cheetos": 10, "lays": 10, "doritos": 10, "pringles": 10, "ruffles": 10, "kinder bueno": 10, "kit kat": 10, "risketos": 10, "gusanitos": 10, "chupa chups": 10, "chicles": 10, "lacasitos": 10, "kinder sorpresa": 10,
      "chocolate": 25, "galletas": 25, "patatas fritas": 25, "patatas": 25, "snickers": 25, "mars": 25, "twix": 25, "bounty": 25, "kinder": 25, "ferrero rocher": 25, "magdalenas": 25, "croissant": 25, "napolitana": 25, "palmera": 25, "ensaimada": 25, "gominolas": 25, "chuches": 25, "caramelos": 25, "palomitas": 25, "pipas": 25, "frutos secos": 25, "cacahuetes": 25,
      "huesitos": 45, "campurrianas": 45, "tosta rica": 45, "chiquilin": 45, "napolitanas": 45, "mantecado": 45, "mantecados": 45, "pelotazos": 45, "gublins": 45, "jumpers": 45, "boca bits": 45, "takis": 45, "mikado": 45, "tokke": 45, "fiesta": 45, "kojak": 45, "fresquito": 45, "donettes": 45, "tigretones": 45, "pinguinos": 45, "ganchitos": 45, "kikos": 45, "pipas tijuana": 45, "pipas facundo": 45, "dinosaurus": 45, "chips ahoy": 45, "digestive": 45, "galletas digestive": 45, "cuetara": 45, "artiach": 45, "gullon": 45, "fontaneda": 45, "milka": 45, "toblerone": 45, "raffaello": 45, "kinder delice": 45, "kinder maxi": 45, "kinder pingui": 45, "kinder joy": 45, "sugus": 45, "peta zetas": 45, "regaliz": 45, "haribo": 45, "mentos": 45, "trident": 45, "bazooka": 45,
      "bimbo": 65, "panrico": 65, "pepitos": 65, "birba": 65, "lotus": 65, "biscoff": 65, "galletas lotus": 65, "oreo thins": 65, "quicos": 65, "cortezas": 65, "chicharrones": 65, "maiz frito": 65, "monster munch": 65, "nachos": 65, "tortilla chips": 65, "snack de queso": 65, "bollo suizo": 65, "caracola": 65, "sobao": 65, "sobaos pasiegos": 65, "barquillo": 65, "barquillos": 65, "oblea": 65, "obleas": 65, "gofre": 65, "gofres": 65, "tronky": 65, "juanola": 65, "pastilla juanola": 65, "fruittella": 65, "pictolin": 65, "ositos de goma": 65, "nubes": 65, "algodon de azucar": 65, "boomer": 65, "milky way": 65,
      "dulcesol": 85, "marbu": 85, "cubanitos": 85, "cheiw": 85, "churruca": 85, "risi": 85, "matutano": 85, "pipas g": 85, "dentyne": 85, "pica pica": 85, "galletas sultana": 85, "palotes de regaliz": 85, 
      "gusiluz": 100, "trolli": 100, "pez": 100, "garrapiñadas": 100, "almendras garrapiñadas": 100, "cacahuetes garrapiñados": 100, "polvos pica pica": 100, "barquillo de nata": 100, 
    }
  },
  {
    id: "gen-020", pack: "general",
    texto: "Marca de ropa, calzado o equipamiento deportivo",
    ejemplo: "luanvi",
    answers: {
      "zara": 10, "nike": 10, "adidas": 10, "pull and bear": 10, "pull bear": 10, "bershka": 10, "stradivarius": 10, "mango": 10, "h and m": 10, "hm": 10, "puma": 10, "decathlon": 10, "quechua": 10, "reebok": 10, "levis": 10, "lacoste": 10, "converse": 10, "vans": 10, "new balance": 10, "primark": 10, "shein": 10, "inditex": 10, "massimo dutti": 10, "oysho": 10,
      "gucci": 25, "prada": 25, "louis vuitton": 25, "chanel": 25, "dior": 25, "versace": 25, "armani": 25, "ralph lauren": 25, "tommy hilfiger": 25, "calvin klein": 25, "supreme": 25, "off white": 25, "balenciaga": 25, "burberry": 25, "hermes": 25, "moncler": 25, "the north face": 25, "north face": 25, "patagonia": 25, "columbia": 25, "timberland": 25, "dr martens": 25, "crocs": 25, "birkenstock": 25, 
      "joma": 45, "kelme": 45, "munich": 45, "paredes": 45, "yumas": 45, "victoria": 45, "pompeii": 45, "scalpers": 45, "el ganso": 45, "spagnolo": 45, "silbon": 45, "desigual": 45, "bimba y lola": 45, "loewe": 45, "salomon": 45, "mizuno": 45, "asics": 45, "under armour": 45, "umbro": 45, "kappa": 45, "hummel": 45, "meyba": 45, "ellesse": 45, "champion": 45, "diadora": 45, "lotto": 45, "fila": 45, "skechers": 45, "camper": 45, "pikolinos": 45, "springfield": 45, "cortefiel": 45, "women secret": 45, "sfera": 45, "lefties": 45, "pepe jeans": 45, "tous": 45, 
      "callaghan": 65, "panama jack": 65, "chiruca": 65, "hanwag": 65, "boreal": 65, "ternua": 65, "bestard": 65, "la sportiva": 65, "salewa": 65, "berghaus": 65, "mammut": 65, "jack wolfskin": 65, "fjallraven": 65, "marmot": 65, "trangoworld": 65, "astore": 65, "altus": 65, "tintoretto": 65, "pedro del hierro": 65, "adolfo dominguez": 65, "purificacion garcia": 65, "custo barcelona": 65, "sita murt": 65, "lois": 65, "quiksilver": 65, "billabong": 65, "roxy": 65, "rip curl": 65, "volcom": 65, 
      "rossignol": 85, "oakley": 85, "odlo": 85, "bullpadel": 85, "nox": 85, "siux": 85, "star vie": 85, "vibor a": 85, "black crown": 85, "babolat": 85, "gioseppo": 85, "hispanitas": 85, "castañer": 85, "pretty ballerinas": 85, "martinelli": 85, "chie mihara": 85, "fluchos": 85, "coolway": 85, "mustang": 85,
      "luanvi": 100, "sappa": 100, "errea": 100, "macron": 100, "givova": 100, "uhlsport": 100, "mitre": 100, "patrick": 100, "pony": 100, "j hayber": 100, "hi tec": 100, "rasan": 100, "arc teryx": 100, "ortovox": 100, "maloja": 100, 
    }
  },
  {
    id: "gen-021", pack: "general",
    texto: "Profesión, oficio tradicional o puesto de trabajo",
    ejemplo: "campanero",
    answers: {
      "medico": 10, "doctor": 10, "profesor": 10, "maestro": 10, "policia": 10, "bombero": 10, "abogado": 10, "ingeniero": 10, "camarero": 10, "albañil": 10, "fontanero": 10, "electricista": 10, "enfermero": 10, "enfermera": 10, "arquitecto": 10, "panadero": 10, "carpintero": 10, "peluquero": 10, "cocinero": 10, "conductor": 10, "taxista": 10, "dentista": 10, "periodista": 10, "jardinero": 10,
      "presidente": 25, "rey": 25, "astronauta": 25, "youtuber": 25, "influencer": 25, "futbolista": 25, "actor": 25, "cantante": 25, "modelo": 25, "escritor": 25, "pintor": 25, "detective": 25, "espia": 25, "pirata": 25, "vaquero": 25, "soldado": 25, "ladron": 25, "mago": 25, "payaso": 25, "emprendedor": 25, "community manager": 25, 
      "chapista": 45, "mecanico": 45, "soldador": 45, "cerrajero": 45, "vidriero": 45, "tapicero": 45, "zapatero": 45, "sastre": 45, "costurera": 45, "carnicero": 45, "pescadero": 45, "barrendero": 45, "basurero": 45, "cartero": 45, "contable": 45, "administrativo": 45, "secretario": 45, "recepcionista": 45, "dependiente": 45, "cajero": 45, "reponedor": 45, "repartidor": 45, "mensajero": 45, "vigilante": 45, "guardia civil": 45, "portero": 45, "conserje": 45, "limpiador": 45, "fisioterapeuta": 45, "psicologo": 45, "veterinario": 45, "celador": 45, "matrona": 45, "optico": 45, "farmaceutico": 45, "agricultor": 45, "pescador": 45, "ganadero": 45, "pastor": 45, "minero": 45, 
      "tornero": 65, "fresador": 65, "auditor": 65, "actuario": 65, "notario": 65, "registrador": 65, "herrero": 65, "estibador": 65, "controlador aereo": 65, "perito": 65, "gruista": 65, "encofrador": 65, "ferrallista": 65, "calderero": 65, "forjador": 65, "ajustador": 65, "electromecanico": 65, "lampista": 65, "yesero": 65, "escayolista": 65, "solador": 65, "cantero": 65, "gestor": 65, "agente de seguros": 65, "corredor de bolsa": 65,
      "luthier": 85, "tonelero": 85, "afilador": 85, "relojero": 85, "taxidermista": 85, "fraguero": 85, "fraguera": 85, "cestero": 85, "alfarero": 85, "ceramista": 85, "orfebre": 85, "joyero": 85, "platero": 85, "armero": 85, "curtidor": 85, "herrador": 85, "carbonero": 85, "leñador": 85, "arriero": 85, "sombrerero": 85, "organero": 85, "ebanista": 85, "encuadernador": 85, 
      "campanero": 100, "boticario": 100, "pregonero": 100, "sereno": 100, "aguador": 100, "amolador": 100, "botero": 100, "calesero": 100, "cordelero": 100, "tejedor": 100, "cardador": 100, "batanero": 100, "dorador": 100, "bruñidor": 100, "litografo": 100, "numismatico": 100, "albeitar": 100, 
    }
  },
  {
    id: "pal-003", pack: "palabras",
    texto: "Palabra que contenga las cinco vocales (panvocálica)",
    ejemplo: "cuodlibetal",
    answers: {
      "murcielago": 10, "eucalipto": 10, "ayuntamiento": 10, "arquitecto": 10, "educacion": 10, "abuelito": 10, "neumatico": 10, "secundario": 10,
      "murciegalo": 25, "aeiou": 25, "aurelio": 25, "eulalio": 25, "eulogia": 25, "euforia": 25, "euforica": 25, "hipotenusa": 25, "orquidea": 25, "supermario": 25, "adulterio": 25, "cuestionar": 25, "albaricoque": 25, "paquidermo": 25, "supercalifragilisticoespialidoso": 25,
      "aceituno": 45, "reumatico": 45, "inadecuado": 45, "autentico": 45, "equivocado": 45, "precaucion": 45, "regulacion": 45, "centrifugado": 45, "comunicable": 45, "comunicarse": 45, "persuasion": 45, "cuadrilatero": 45, "revolucionaria": 45, "revolucionario": 45, "universitario": 45, "audiovisuales": 45, "pañuelito": 45, "suplementario": 45, "presupuestario": 45, "documentalista": 45, "entusiasmo": 45, "entusiasmado": 45, "estimulador": 45, "estimuladora": 45, "evolucionar": 45, "educativo": 45, "configurable": 45, "cuestionario": 45, "curiosamente": 45, "desilusionar": 45, "funcionamiento": 45, "numeracion": 45, "puntuaciones": 45, "reputacion": 45, "restauracion": 45, "situaciones": 45, "superpoblacion": 45, "voluntariedad": 45, "publicaciones": 45, "recuperacion": 45, "remuneracion": 45, "reunificacion": 45, "subestimado": 45, "sobreactuacion": 45, "consecuencia": 45,
      "reconquistar": 65, "menstruacion": 65, "encuadernacion": 65, "republicano": 65, "consanguineo": 65, "desarticulado": 65, "desarticulacion": 65, "aceitunero": 65, "escupitajo": 65, "aguileño": 65, "acuñamiento": 65, "arquitectonico": 65, "argumentacion": 65, "autenticacion": 65, "autorregulacion": 65, "bautisterio": 65, "cauterizacion": 65, "coeducacion": 65, "consecutiva": 65, "conquistadores": 65, "cuentakilometros": 65, "desahuciado": 65, "desocupacion": 65, "despreocupacion": 65, "documentaria": 65, "ecuatoriano": 65, "especulacion": 65, "estructuracion": 65, "excomulgacion": 65, "farmaceutico": 65, "gesticulacion": 65, "gubernativo": 65, "alucinogeno": 65, "insurreccional": 65, "interurbano": 65, "justipreciado": 65, "lubricaciones": 65, "manipuladores": 65, "pasteurizado": 65, "persecutoria": 65, "autobiograficamente": 65,
      "vituperando": 85, "jaquimero": 85, "guaperio": 85, "sudoriental": 85, "zurrapiento": 85, "enloquecida": 85, "cigueñato": 85, "comunicadero": 85, "pseudoganglio": 85, "arquiepiscopal": 85, "auriculoventricular": 85, "autoindulgencia": 85, "boquiabierto": 85, "circunnavegacion": 85, "consuetudinario": 85, "contrarrevolucion": 85, "cuadragesimo": 85, "desnaturalizado": 85, "electroacustica": 85, "genitourinaria": 85, "hipoglucemia": 85, "incomunicable": 85, "semiconductoras": 85, "neurocirugia": 85, "ultraperiferico": 85,
      "estanquillero": 100, "cuodlibetal": 100, "cuakerismo": 100, "cuaquerismo": 100, "cuadriplejico": 100, "neuropsiquiatra": 100, "seudohermafrodita": 100, "arqueobacteriano": 100, "esternoclavicular": 100, "aurifero": 100, "eudiometria": 100, "leucocitaria": 100, "aguijonear": 100, "autoluminiscente": 100, "braquiocefalico": 100
    }
  },
  {
    id: "pal-004", pack: "palabras",
    texto: "Palíndromo en español (se lee igual al derecho y al revés)",
    ejemplo: "rotomotor",
    answers: {
      "oso": 10, "ojo": 10, "ana": 10, "reconocer": 10, "somos": 10, "radar": 10, "salas": 10, "solos": 10,
      "aibofobia": 25, "dabale arroz a la zorra el abad": 25, "anita lava la tina": 25, "amo la paloma": 25, "yo hago yoga hoy": 25, "luz azul": 25, "kayak": 25, "otto": 25, "bob": 25, "ava": 25, "ada": 25, "eve": 25, "hannah": 25, "tenet": 25, "lol": 25, "wow": 25,
      "rotor": 45, "seres": 45, "sedes": 45, "aca": 45, "alla": 45, "oro": 45, "ala": 45, "ama": 45, "ata": 45, "asa": 45, "ara": 45, "aya": 45, "aja": 45, "ese": 45, "eje": 45, "efe": 45, "ele": 45, "eme": 45, "ene": 45, "eñe": 45, "ere": 45, "erre": 45, "elle": 45, "sus": 45, "non": 45, "pop": 45, "gag": 45, "pep": 45, "nadan": 45, "narran": 45, "sanas": 45, "sacas": 45, "sagas": 45, "sosos": 45, "sotos": 45, "rayar": 45, "rajar": 45, "rallar": 45, "rapar": 45, "rasar": 45, "ojo rojo": 45, "oso baboso": 45,
      "anilina": 65, "arenera": 65, "arepera": 65, "anona": 65, "anana": 65, "rodador": 65, "sometemos": 65, "rever": 65, "acurruca": 65, "aviva": 65, "azuza": 65, "aerea": 65, "alela": 65, "alila": 65, "amama": 65, "amima": 65, "apipa": 65, "ateta": 65, "afofa": 65, "sajas": 65, "selles": 65, "sobos": 65, "sexes": 65, "napan": 65, "madam": 65, "oruro": 65, "aza": 65, "apa": 65, "ete": 65, "arra": 65, "nen": 65, "somos o no somos": 65, "alli ves sevilla": 65, "arriba la birra": 65, "la ruta natural": 65, "a ti no bonita": 65, "ella te da detalle": 65,
      "amad a la dama": 85, "se van sus naves": 85, "son robos o sobornos": 85, "atar a la rata": 85, "no traces en ese carton": 85, "isaac no ronca asi": 85, "se verlas al reves": 85, "nada yo soy adan": 85, "adan no calla con nada": 85, "yo dono rosas oro no doy": 85, "amo la pacifica paloma": 85, "ana lleva al oso la avellana": 85, "oi lo de mama me dolio": 85, "sometamos o matemos": 85, "a la torre derrotala": 85, "añora la roña": 85, "amarga la grama": 85, "ata la lata": 85, "alala": 85, "alula": 85, "asesa": 85, "apopa": 85, "afufa": 85, "acoca": 85, "arara": 85,
      "rotomotor": 100, "aña": 100, "uru": 100, "oto": 100, "aga": 100, "sebes": 100, "seles": 100, "senes": 100, "setes": 100, "soros": 100, "sonos": 100, "robor": 100, "rodor": 100, "razar": 100, "malayalam": 100, "atale demoniaco cain o me delata": 100, "salta lenin el atlas": 100, "la ruta nos aporto otro paso natural": 100, "eva usaba rimel y le miraba suave": 100, "alli si maria avisa y asi va a ir a mi silla": 100
    }
  },
  {
    id: "pal-005", pack: "palabras",
    texto: "Verbo en español terminado en «-ecer» o «-ducir»",
    ejemplo: "desguarnecer",
    answers: {
      "crecer": 10, "nacer": 10, "parecer": 10, "amanecer": 10, "aparecer": 10, "desaparecer": 10, "conducir": 10, "producir": 10, "traducir": 10,
      "hacer": 25, "renacer": 25, "conocer": 25, "reconocer": 25, "seducir": 25, "reducir": 25, "introducir": 25, "reproducir": 25, "deducir": 25, "inducir": 25, "mecer": 25,
      "ofrecer": 45, "merecer": 45, "pertenecer": 45, "agradecer": 45, "obedecer": 45, "desobedecer": 45, "establecer": 45, "restablecer": 45, "padecer": 45, "compadecer": 45, "fallecer": 45, "desfallecer": 45, "carecer": 45, "perecer": 45, "florecer": 45, "envejecer": 45, "rejuvenecer": 45, "oscurecer": 45, "esclarecer": 45, "anochecer": 45, "atardecer": 45, "enriquecer": 45, "empobrecer": 45, "enloquecer": 45, "enfurecer": 45, "enmudecer": 45, "ensordecer": 45, "enrojecer": 45, "desvanecer": 45, "permanecer": 45, "fortalecer": 45, "abastecer": 45, "favorecer": 45, "desfavorecer": 45, "apetecer": 45, "encarecer": 45, "reconducir": 45, "abducir": 45,
      "adolecer": 65, "acontecer": 65, "acaecer": 65, "comparecer": 65, "reaparecer": 65, "prevalecer": 65, "convalecer": 65, "resplandecer": 65, "estremecer": 65, "palidecer": 65, "humedecer": 65, "rehumedecer": 65, "endurecer": 65, "reblandecer": 65, "ablandecer": 65, "enternecer": 65, "entristecer": 65, "embellecer": 65, "empequeñecer": 65, "engrandecer": 65, "enaltecer": 65, "enorgullecer": 65, "envanecer": 65, "envilecer": 65, "ennoblecer": 65, "embrutecer": 65, "entontecer": 65, "entorpecer": 65, "entumecer": 65, "adormecer": 65, "aborrecer": 65, "emblanquecer": 65, "ennegrecer": 65, "ensombrecer": 65, "reverdecer": 65, "decrecer": 65, "desabastecer": 65, "preestablecer": 65, "aducir": 65, "coproducir": 65,
      "languidecer": 85, "robustecer": 85, "guarnecer": 85, "encanecer": 85, "encallecer": 85, "enmohecer": 85, "enmugrecer": 85, "enronquecer": 85, "enflaquecer": 85, "enceguecer": 85, "enardecer": 85, "encandecer": 85, "enrarecer": 85, "ensoberbecer": 85, "embobecer": 85, "escarnecer": 85, "recrudecer": 85, "reflorecer": 85, "amarillecer": 85, "alborecer": 85, "clarecer": 85, "transparecer": 85, "trasparecer": 85, "acrecer": 85, "recrecer": 85, "remecer": 85, "autoabastecer": 85, "reintroducir": 85, "sobreproducir": 85, "autoinducir": 85,
      "desguarnecer": 100, "desadormecer": 100, "lobreguecer": 100, "tenebrecer": 100, "arbolecer": 100, "herbecer": 100, "hojecer": 100, "frutecer": 100, "pimpollecer": 100, "tallecer": 100, "retoñecer": 100, "tardecer": 100, "remanecer": 100, "fosforecer": 100, "amortecer": 100, "amodorrecer": 100, "empedernecer": 100, "podrecer": 100, "educir": 100
    }
  },
  {
    id: "pal-006", pack: "palabras",
    texto: "Palabra en español que empiece por la letra «K» o «W»",
    ejemplo: "wagneriano",
    answers: {
      "kilo": 10, "kilometro": 10, "kiwi": 10, "karate": 10, "koala": 10, "ketchup": 10, "karaoke": 10, "web": 10, "wifi": 10, "whisky": 10,
      "whatsapp": 25, "wikipedia": 25, "windows": 25, "word": 25, "walkman": 25, "water": 25, "wc": 25, "kebab": 25, "karma": 25, "kamikaze": 25, "king kong": 25, "kit kat": 25, "kleenex": 25, "kriptonita": 25,
      "kefir": 45, "kimono": 45, "kayak": 45, "kiosco": 45, "kiosko": 45, "kilogramo": 45, "kilovatio": 45, "kilocaloria": 45, "kilohercio": 45, "kilobyte": 45, "karateca": 45, "kart": 45, "karting": 45, "katiuska": 45, "kermes": 45, "kermesse": 45, "kit": 45, "kitsch": 45, "krill": 45, "kung fu": 45, "kurdo": 45, "kuwaiti": 45, "keniata": 45, "keniano": 45, "kazajo": 45, "kosovar": 45, "waterpolo": 45, "waterpolista": 45, "windsurf": 45, "windsurfista": 45, "wok": 45, "wasabi": 45, "waffle": 45, "western": 45, "walkie talkie": 45, "wolframio": 45, "wiski": 45, "watt": 45, "watio": 45, "webcam": 45, "webinar": 45, "widget": 45,
      "krausismo": 65, "krausista": 65, "kaiser": 65, "kan": 65, "kripton": 65, "kinesiologia": 65, "kinesiologo": 65, "kumquat": 65, "kirie": 65, "kirieleison": 65, "kibutz": 65, "kosher": 65, "kohl": 65, "kohol": 65, "kurdistan": 65, "kale borroka": 65, "kalashnikov": 65, "kombucha": 65, "kaki": 65, "kaolin": 65, "kapok": 65, "karst": 65, "karstico": 65, "kelvin": 65, "keroseno": 65, "kilopondio": 65, "kilolitro": 65, "kilometraje": 65, "kilometrico": 65, "wakeboard": 65, "wombat": 65, "wapiti": 65, "weber": 65, "whist": 65, "whiskey": 65, "wolfram": 65, "walkiria": 65, "walon": 65, "washingtoniano": 65,
      "kopek": 85, "kraken": 85, "koljoz": 85, "kvas": 85, "kumis": 85, "kirguis": 85, "kirsch": 85, "kermesita": 85, "kimberlita": 85, "kainita": 85, "kernita": 85, "kieselgur": 85, "kieserita": 85, "kiloton": 85, "kilojulio": 85, "kinestesia": 85, "kendo": 85, "kenpo": 85, "kabuki": 85, "kakemono": 85, "koto": 85, "kalimba": 85, "kazoo": 85, "wigwam": 85, "wolframita": 85, "wurtzita": 85, "wellingtonia": 85, "weimares": 85, "westfaliano": 85,
      "wagneriano": 100, "wagnerismo": 100, "willemita": 100, "wollastonita": 100, "wulfenita": 100, "wavellita": 100, "witherita": 100, "kantiano": 100, "kantismo": 100, "kafkiano": 100, "keynesiano": 100, "keynesianismo": 100, "kurchatovio": 100, "kufico": 100
    }
  },
  {
    id: "pal-007", pack: "palabras",
    texto: "Gentilicio español terminado en «-ense»",
    ejemplo: "arcobrigense",
    answers: {
      "onubense": 10, "almeriense": 10, "conquense": 10, "abulense": 10, "pacense": 10, "lucense": 10, "castellonense": 10, "melillense": 10, "albacetense": 10,
      "madrilense": 25, "barcelonense": 25, "sevillense": 25, "bilbainense": 25, "valenciense": 25, "cordobense": 25, "granadense": 25, "zaragocense": 25, "malaguense": 25, "murciense": 25, "toledense": 25, "logroñense": 25, "coruñense": 25,
      "complutense": 45, "oscense": 45, "turolense": 45, "gerundense": 45, "ilerdense": 45, "auriense": 45, "tarraconense": 45, "ovetense": 45, "emeritense": 45, "cartaginense": 45, "jiennense": 45, "giennense": 45, "asturicense": 45, "segobricense": 45, "castrense": 45, "getafense": 45, "leganense": 45, "alcobendense": 45, "escurialense": 45, "marbellense": 45, "torremolinense": 45, "benalmadense": 45, "mijense": 45, "linense": 45, "portuense": 45, "arcense": 45, "ubetense": 45, "linarense": 45, "ejidense": 45, "eldense": 45, "villenense": 45, "benidormense": 45, "torrevejense": 45, "gandiense": 45, "villarrealense": 45, "hospitalense": 45, "badalonense": 45, "sabadellense": 45, "terrassense": 45, "mataronense": 45, "reusense": 45, "pratense": 45, "torrelaveguense": 45, "mierense": 45,
      "hispalense": 65, "matritense": 65, "cordubense": 65, "malacitense": 65, "ourensense": 65, "barbastrense": 65, "montisonense": 65, "ripense": 65, "binefarense": 65, "sabiñaniguense": 65, "barañainense": 65, "alfarense": 65, "medinense": 65, "arevalense": 65, "arenense": 65, "aguilarense": 65, "puertollanense": 65, "villarrobledense": 65, "rodense": 65, "azudense": 65, "guadarramense": 65, "donbenitense": 65, "villanovense": 65, "almendralejense": 65, "zafrense": 65, "molinense": 65, "unionense": 65, "noveldense": 65, "petrerense": 65, "dianense": 65, "requenense": 65, "vinarocense": 65, "burrianense": 65, "manacorense": 65, "inquense": 65, "alcudiense": 65, "teldense": 65, "orotavense": 65,
      "legionense": 85, "setabense": 85, "arriacense": 85, "calceatense": 85, "mirobrigense": 85, "egabrense": 85, "osunense": 85, "eciense": 85, "carmonense": 85, "moronense": 85, "arahalense": 85, "estepense": 85, "prieguense": 85, "baenense": 85, "pozoblanquense": 85, "peñarriblense": 85, "bailenense": 85, "carolinense": 85, "martense": 85, "arundense": 85, "archidonense": 85, "egarense": 85, "ausonense": 85, "barcinonense": 85, "tudense": 85, "viveirense": 85, "ribadense": 85, "lalinense": 85, "verinense": 85,
      "arcobrigense": 100, "iliturgitense": 100, "brigantiense": 100, "valldemosense": 100, "turiasonense": 100, "uxamense": 100, "cauriense": 100, "norbense": 100, "asidonense": 100, "cluniense": 100, "dertosense": 100, "ausense": 100, "cañarense": 100, "yaicense": 100
    }
  },
  {
    id: "pal-008", pack: "palabras",
    texto: "Palabra de origen árabe (arabismo) incorporada al español",
    ejemplo: "almuerza",
    answers: {
      "ojala": 10, "almohada": 10, "aceite": 10, "aceituna": 10, "azucar": 10, "alcalde": 10, "albañil": 10, "alcachofa": 10, "alfombra": 10, "ajedrez": 10,
      "ala": 25, "arabe": 25, "islam": 25, "coran": 25, "ramadan": 25, "burka": 25, "cuscus": 25, "kebab": 25, "shisha": 25, "hummus": 25, "sultan": 25, "ole": 25, "guadalquivir": 25, "alhambra": 25,
      "zanahoria": 45, "alfiler": 45, "alberca": 45, "almacen": 45, "arrecife": 45, "acequia": 45, "albaricoque": 45, "alhaja": 45, "jarabe": 45, "naranja": 45, "limon": 45, "berenjena": 45, "algodon": 45, "arroz": 45, "azafran": 45, "azahar": 45, "albahaca": 45, "tarifa": 45, "aduana": 45, "barrio": 45, "aldea": 45, "arrabal": 45, "zanja": 45, "mazapan": 45, "almibar": 45, "alcazar": 45, "alcazaba": 45, "mezquita": 45, "alquimia": 45, "algebra": 45, "algoritmo": 45, "cifra": 45, "cero": 45, "albornoz": 45, "azulejo": 45, "adobe": 45, "alcohol": 45, "guitarra": 45, "azul": 45, "marfil": 45,
      "alacran": 65, "jabali": 65, "alcali": 65, "almena": 65, "almazara": 65, "almadraba": 65, "alcornoque": 65, "albufera": 65, "alacena": 65, "alcoba": 65, "azotea": 65, "zaguan": 65, "tabique": 65, "alcantarilla": 65, "adoquin": 65, "noria": 65, "aljibe": 65, "adarve": 65, "alambique": 65, "albardilla": 65, "albacea": 65, "alferez": 65, "alguacil": 65, "almirante": 65, "zoco": 65, "atalaya": 65, "bellota": 65, "rehen": 65, "asesino": 65, "fulano": 65, "hazaña": 65, "albañileria": 65, "babucha": 65, "chilaba": 65, "laud": 65, "alfalfa": 65, "algarroba": 65, "azar": 65, "alfil": 65,
      "rehala": 85, "alqueria": 85, "almadia": 85, "zalea": 85, "alfonci": 85, "acebuche": 85, "jaqueca": 85, "elixir": 85, "alcanfor": 85, "alquitran": 85, "azufre": 85, "azogue": 85, "zenit": 85, "nadir": 85, "acimut": 85, "arroba": 85, "fanega": 85, "albaran": 85, "arancel": 85, "tahona": 85, "jinete": 85, "alfanje": 85, "almirez": 85, "aldaba": 85, "alfeizar": 85, "algarabia": 85, "añil": 85, "albañal": 85, "gañan": 85, "alfeñique": 85,
      "almuerza": 100, "maravedi": 100, "alboronia": 100, "alcancia": 100, "acicate": 100, "almojarife": 100, "almotacen": 100, "almogavar": 100, "muladi": 100, "almocarabe": 100, "ataujia": 100, "taracea": 100, "guadamacil": 100, "añafil": 100, "azud": 100
    }
  },
  {
    id: "pal-009", pack: "palabras",
    texto: "Sinónimo en español de «enfadado» o «cabreado»",
    ejemplo: "mohino",
    answers: {
      "enojado": 10, "cabreado": 10, "furioso": 10, "molesto": 10, "irritado": 10, "indignado": 10, "rabioso": 10, "colerico": 10, "enfurecido": 10,
      "enfadado": 25, "mad": 25, "angry": 25, "hater": 25, "salty": 25, "tilt": 25, "tilteado": 25, "rayado": 25, "rallado": 25, "triste": 25, "loco": 25, "de mala leche": 25, "de mala hostia": 25, "de malas pulgas": 25, "hasta las narices": 25, "hasta el gorro": 25, "hasta la coronilla": 25, "hasta los huevos": 25,
      "airado": 45, "mosqueado": 45, "encolerizado": 45, "ofendido": 45, "alterado": 45, "disgustado": 45, "resentido": 45, "malhumorado": 45, "crispado": 45, "exasperado": 45, "chinado": 45, "chinchado": 45, "harto": 45, "caliente": 45, "picado": 45, "quemado": 45, "rebotado": 45, "encendido": 45, "ardido": 45, "frustrado": 45, "fastidiado": 45, "contrariado": 45, "amargado": 45, "agrio": 45, "avinagrado": 45, "gruñon": 45, "cascarrabias": 45, "borde": 45, "arisco": 45, "brusco": 45, "aspero": 45, "tenso": 45, "nervioso": 45, "agitado": 45, "exaltado": 45, "desquiciado": 45, "fuera de si": 45, "echando chispas": 45, "echando humo": 45, "hecho una furia": 45, "negro": 45, "cruzado": 45, "torcido": 45, "encabronado": 45,
      "enconado": 65, "embravecido": 65, "repateado": 65, "sulfurado": 65, "irritadisimo": 65, "soliviantado": 65, "furibundo": 65, "encrespado": 65, "enrabietado": 65, "enrabiado": 65, "despechado": 65, "enfurruñado": 65, "ceñudo": 65, "huraño": 65, "hosco": 65, "adusto": 65, "refunfuñon": 65, "regañon": 65, "emperrado": 65, "emberrinchado": 65, "incordiado": 65, "escocido": 65, "resquemado": 65, "agraviado": 65, "ultrajado": 65, "dolido": 65, "herido": 65, "mortificado": 65, "humillado": 65, "enervado": 65, "acalorado": 65, "enardecido": 65, "exacerbado": 65, "endemoniado": 65, "endiablado": 65, "frenetico": 65, "energumeno": 65, "sacado de quicio": 65, "hecho un basilisco": 65, "trinando": 65,
      "mohino": 85, "amohinado": 85, "atrabiliario": 85, "iracundo": 85, "irascible": 85, "bilioso": 85, "ensañado": 85, "corajudo": 85, "encorajinado": 85, "encabritado": 85, "destemplado": 85, "desabrido": 85, "torvo": 85, "ofuscado": 85, "obcecado": 85, "descompuesto": 85, "estomagado": 85, "hastiado": 85, "hocicon": 85, "tostado": 85, "reconcomido": 85, "campanudo": 85, "picajoso": 85, "quisquilloso": 85,
      "sañudo": 100, "sañoso": 100, "desasosegado": 100, "bilis": 100, "atrabilioso": 100, "amoscado": 100, "amostazado": 100, "atufado": 100, "emberrenchinado": 100, "iroso": 100, "corajoso": 100, "desbautizado": 100, "encorajado": 100
    }
  },
  {
    id: "pal-010", pack: "palabras",
    texto: "Palabra o expresión coloquial en España para referirse al dinero",
    ejemplo: "parne",
    answers: {
      "pasta": 10, "guita": 10, "perras": 10, "cuartos": 10, "duros": 10, "plata": 10, "billetes": 10, "pavos": 10, "pelas": 10, "tela": 10,
      "dinero": 25, "euros": 25, "pesetas": 25, "dolares": 25, "money": 25, "cash": 25, "efectivo": 25, "metalico": 25, "tarjeta": 25, "bizum": 25, "bitcoin": 25, "cripto": 25, "oro": 25, "sueldo": 25, "capital": 25,
      "parne": 45, "lana": 45, "viruta": 45, "lereles": 45, "lerele": 45, "panoja": 45, "pasta gansa": 45, "pastizal": 45, "un pastizal": 45, "paston": 45, "dineral": 45, "millonada": 45, "kilos": 45, "kilo": 45, "talegos": 45, "talego": 45, "pavo": 45, "duro": 45, "pela": 45, "perra": 45, "suelto": 45, "calderilla": 45, "chatarra": 45, "cambio": 45, "vuelta": 45, "vueltas": 45, "fajo": 45, "fajos": 45, "taco": 45, "mazo": 45, "fondos": 45, "ahorros": 45, "fortuna": 45, "riqueza": 45, "calas": 45, "cala": 45, "chapas": 45, "chinchin": 45, "monises": 45, "monis": 45,
      "leña": 65, "manteca": 65, "mosca": 65, "vil metal": 65, "el vil metal": 65, "gallina": 65, "boniatos": 65, "boniato": 65, "verdes": 65, "verde": 65, "morados": 65, "bin laden": 65, "binladen": 65, "cinco duros": 65, "veinte duros": 65, "perra gorda": 65, "perra chica": 65, "chavos": 65, "chavo": 65, "ochavos": 65, "ochavo": 65, "reales": 65, "real": 65, "cobres": 65, "maravedies": 65, "maravedi": 65, "monedas": 65, "papel": 65, "papeles": 65, "pellizco": 65, "pico": 65, "riñon": 65, "un riñon": 65, "puñado": 65, "colchon": 65, "coste": 65,
      "pastuqui": 85, "perrillas": 85, "pelillas": 85, "cuartejos": 85, "dineros": 85, "peculio": 85, "pecunia": 85, "numerario": 85, "liquidez": 85, "caudal": 85, "hacienda": 85, "haberes": 85, "mordida": 85, "sobre": 85, "astilla": 85, "tajada": 85, "morterada": 85, "mandanga": 85, "rubias": 85, "sin blanca": 85, "potosi": 85, "don dinero": 85, "manteca colora": 85, "pomada": 85, "sangre": 85, "unguento": 85, "crema": 85, "centenes": 85, "picorza": 85, "manises": 85, "biyuyos": 85, "ducal": 85,
      "jurdeles": 100, "jurdel": 100, "jurdo": 100, "jurdos": 100, "marmaja": 100, "talegada": 100, "chulapos": 100, "cumquibus": 100, "cum quibus": 100, "conquibus": 100, "parnes": 100, "jares": 100, "faltriquera": 100, "unguento amarillo": 100
    }
  },
  {
    id: "pal-011", pack: "palabras",
    texto: "Sigla lexicalizada o acrónimo de uso cotidiano en español",
    ejemplo: "inri",
    answers: {
      "ovni": 10, "sida": 10, "laser": 10, "radar": 10, "dni": 10, "itv": 10, "iva": 10, "uci": 10, "ong": 10, "vip": 10,
      "ok": 25, "etc": 25, "sos": 25, "rip": 25, "lol": 25, "pdf": 25, "usb": 25, "wifi": 25, "gps": 25, "dvd": 25, "tv": 25, "ia": 25,
      "pyme": 45, "pymes": 45, "renfe": 45, "talgo": 45, "ave": 45, "adif": 45, "feve": 45, "dgt": 45, "boe": 45, "rae": 45, "aemet": 45, "eso": 45, "fp": 45, "ebau": 45, "evau": 45, "pau": 45, "uned": 45, "mir": 45, "uvi": 45, "irpf": 45, "iban": 45, "euribor": 45, "ipc": 45, "pib": 45, "tdt": 45, "led": 45, "pin": 45, "sim": 45, "ampa": 45, "apa": 45, "inem": 45, "sepe": 45, "erte": 45, "ere": 45, "otan": 45, "onu": 45, "unesco": 45, "unicef": 45, "oms": 45, "ue": 45, "fbi": 45, "cia": 45, "nasa": 45,
      "ceoe": 65, "ugt": 65, "ccoo": 65, "csif": 65, "once": 65, "rtve": 65, "tve": 65, "rne": 65, "efe": 65, "sgae": 65, "ifema": 65, "fitur": 65, "cni": 65, "cnp": 65, "tedax": 65, "geo": 65, "geas": 65, "seprona": 65, "ume": 65, "samur": 65, "summa": 65, "muface": 65, "imserso": 65, "aeat": 65, "cnmv": 65, "ibex": 65, "opa": 65, "ico": 65, "nie": 65, "nif": 65, "cif": 65, "bop": 65, "boc": 65, "tac": 65, "pcr": 65, "vih": 65, "adn": 65, "arn": 65,
      "inri": 85, "sonar": 85, "modem": 85, "bit": 85, "pixel": 85, "codec": 85, "captcha": 85, "spam": 85, "bot": 85, "pulsar": 85, "cuasar": 85, "maser": 85, "scuba": 85, "taser": 85, "teflon": 85, "nailon": 85, "licra": 85, "velcro": 85, "emoticono": 85, "webinar": 85, "podcast": 85, "motel": 85, "fanzine": 85, "interpol": 85, "fogasa": 85, "aenor": 85, "ampel": 85, "sedena": 85,
      "ofimatica": 100, "informatica": 100, "telematica": 100, "domotica": 100, "burotica": 100, "tergal": 100, "bonobus": 100, "mupe": 100, "campsa": 100, "endesa": 100, "cepsa": 100, "seat": 100, "banesto": 100, "icona": 100, "benelux": 100, "mercosur": 100
    }
  },
  {
    id: "pal-012", pack: "palabras",
    texto: "Sufijo diminutivo, aumentativo o apreciativo en español (o palabras formadas con ellos)",
    ejemplo: "achon",
    answers: {
      "ito": 10, "ita": 10, "on": 10, "ona": 10, "azo": 10, "aza": 10, "illo": 10, "illa": 10, "casita": 10, "perrito": 10,
      "isimo": 25, "isima": 25, "mente": 25, "dor": 25, "cion": 25, "oso": 25, "able": 25, "ible": 25, "ero": 25, "era": 25, "ista": 25, "ismo": 25, "dad": 25,
      "ico": 45, "ica": 45, "in": 45, "ina": 45, "iño": 45, "iña": 45, "uco": 45, "uca": 45, "ete": 45, "eta": 45, "ote": 45, "ota": 45, "uelo": 45, "uela": 45, "ejo": 45, "eja": 45, "ucho": 45, "ucha": 45, "aco": 45, "aca": 45, "cito": 45, "cita": 45, "ecito": 45, "ecita": 45, "cillo": 45, "cilla": 45, "gatito": 45, "chiquito": 45, "pequeñito": 45, "poquito": 45, "ratito": 45, "cafelito": 45, "cervecita": 45, "cochecito": 45, "abuelito": 45, "pajarito": 45, "perrazo": 45, "golazo": 45, "temazo": 45, "cabezota": 45, "librote": 45,
      "acho": 65, "acha": 65, "ato": 65, "ata": 65, "orrio": 65, "orria": 65, "astro": 65, "astra": 65, "ango": 65, "anga": 65, "ales": 65, "oncho": 65, "uza": 65, "uzo": 65, "orro": 65, "ventanuco": 65, "chiquillo": 65, "pajarillo": 65, "pequeñin": 65, "chiquitin": 65, "mujerona": 65, "cabezon": 65, "narigon": 65, "barrigon": 65, "solteron": 65, "grandullon": 65, "moceton": 65, "libraco": 65, "pajarraco": 65, "bicharraco": 65, "casucha": 65, "pueblucho": 65, "perrucho": 65, "cuartucho": 65, "medicucho": 65, "gentuza": 65, "callejuela": 65, "plazuela": 65, "riachuelo": 65, "palabrota": 65,
      "achon": 85, "achona": 85, "uzco": 85, "uzca": 85, "ingo": 85, "inga": 85, "orio": 85, "iche": 85, "ezno": 85, "ezna": 85, "arraco": 85, "ijon": 85, "ejon": 85, "ullon": 85, "eton": 85, "ricachon": 85, "bonachon": 85, "frescachon": 85, "corpachon": 85, "villorrio": 85, "bodorrio": 85, "camastro": 85, "poetastro": 85, "pequeñuelo": 85, "niñato": 85, "señoritingo": 85, "lobezno": 85, "osezno": 85,
      "ingorrio": 100, "astron": 100, "erete": 100, "olacho": 100, "ezuelo": 100, "ezuela": 100, "zuelo": 100, "zuela": 100, "reyezuelo": 100, "ladronzuelo": 100, "pedrusco": 100, "peñasco": 100, "poblacho": 100, "vivales": 100, "frescales": 100
    }
  },
  {
    id: "pal-013", pack: "palabras",
    texto: "Palabra esdrújula en español (fuerza o tilde en antepenúltima sílaba)",
    ejemplo: "forunculo",
    answers: {
      "esdrujula": 10, "musica": 10, "telefono": 10, "pajaro": 10, "sabado": 10, "medico": 10, "arboles": 10, "camara": 10, "pelicula": 10, "rapido": 10,
      "sobresdrujula": 25, "facilmente": 25, "rapidamente": 25, "ultimamente": 25, "practicamente": 25, "mama": 25, "papa": 25, "arbol": 25, "corazon": 25, "balon": 25, "examen": 25, "joven": 25, "farmacia": 25, "policia": 25,
      "brujula": 45, "plastico": 45, "logica": 45, "quimica": 45, "fisica": 45, "matematicas": 45, "pagina": 45, "ultimo": 45, "angulo": 45, "critica": 45, "clasico": 45, "publico": 45, "victima": 45, "lagrima": 45, "numero": 45, "oxigeno": 45, "epoca": 45, "panico": 45, "helicoptero": 45, "calido": 45, "petalo": 45, "platano": 45, "arandano": 45, "brocoli": 45, "esparrago": 45, "rabano": 45, "oregano": 45, "higado": 45, "estomago": 45, "musculo": 45, "craneo": 45, "oceano": 45, "malaga": 45, "cordoba": 45, "semaforo": 45, "lampara": 45, "sabana": 45, "maquina": 45, "fabrica": 45, "trafico": 45, "miercoles": 45, "jovenes": 45, "examenes": 45,
      "tentaculo": 65, "fosforo": 65, "parvulo": 65, "vertice": 65, "orbita": 65, "libelula": 65, "liquido": 65, "solido": 65, "cubico": 65, "mitico": 65, "vortice": 65, "centimetro": 65, "kilometro": 65, "termometro": 65, "cronometro": 65, "microfono": 65, "prismaticos": 65, "murcielago": 65, "hipopotamo": 65, "tarantula": 65, "pelicano": 65, "aguila": 65, "bufalo": 65, "vibora": 65, "relampago": 65, "rafaga": 65, "piramide": 65, "triangulo": 65, "circulo": 65, "pendulo": 65, "idolo": 65, "heroe": 65, "atomo": 65, "celula": 65, "molecula": 65, "capsula": 65, "cantaro": 65, "cañamo": 65,
      "forunculo": 85, "sarcofago": 85, "esofago": 85, "epigrafe": 85, "alcali": 85, "paralisis": 85, "pentagono": 85, "poligono": 85, "placido": 85, "crepusculo": 85, "oraculo": 85, "jeroglifico": 85, "archipielago": 85, "hiperbole": 85, "metafora": 85, "atmosfera": 85, "catastrofe": 85, "satrapa": 85, "despota": 85, "naufrago": 85, "profugo": 85, "zangano": 85, "timpano": 85, "clavicula": 85, "mandibula": 85, "vertebra": 85, "luciernaga": 85, "pequeñisimo": 85,
      "paralelepipedo": 100, "centrifuga": 100, "polifacetico": 100, "otorrinolaringologo": 100, "electroencefalografo": 100, "ventrilocuo": 100, "pusilanime": 100, "magnanimo": 100, "unanime": 100, "ecuanime": 100, "efimero": 100, "pristino": 100, "diafano": 100, "opiparo": 100, "ñañigo": 100
    }
  },
  {
    id: "pal-014", pack: "palabras",
    texto: "Onomatopeya en español (sonido de animal, acción o golpe)",
    ejemplo: "pataplum",
    answers: {
      "guau": 10, "miau": 10, "pum": 10, "zas": 10, "mu": 10, "muu": 10, "pio": 10, "cuac": 10, "beee": 10, "kikiriki": 10,
      "boom": 25, "crash": 25, "bang": 25, "pow": 25, "splash": 25, "zap": 25, "boing": 25, "ring": 25, "ring ring": 25, "ding dong": 25, "oink": 25, "meow": 25, "woof": 25, "beep": 25, "click": 25, "crack": 25,
      "tic tac": 45, "tictac": 45, "toc toc": 45, "achis": 45, "glu glu": 45, "gluglu": 45, "pio pio": 45, "piopio": 45, "guau guau": 45, "miau miau": 45, "bee": 45, "mee": 45, "croac": 45, "cri cri": 45, "quiquiriqui": 45, "cloc": 45, "clic": 45, "crac": 45, "chas": 45, "chof": 45, "plaf": 45, "plas": 45, "plash": 45, "cataplum": 45, "paf": 45, "puf": 45, "uf": 45, "ay": 45, "uy": 45, "bah": 45, "shh": 45, "chist": 45, "psst": 45, "ñam": 45, "ñam ñam": 45, "ja ja": 45, "je je": 45, "ji ji": 45, "jo jo": 45, "jaja": 45, "blablabla": 45, "brr": 45, "zzz": 45,
      "bum": 65, "zum": 65, "bzzz": 65, "ssss": 65, "bof": 65, "baf": 65, "zasca": 65, "patapum": 65, "patatras": 65, "catacrac": 65, "catapun": 65, "pumba": 65, "chim pum": 65, "chimpun": 65, "tachan": 65, "clin": 65, "clinc": 65, "clan": 65, "clon": 65, "talan": 65, "tilin": 65, "tolon": 65, "din don": 65, "tan tan": 65, "chucu chucu": 65, "chu chu": 65, "run run": 65, "runrun": 65, "brum": 65, "piii": 65, "mec mec": 65, "moc moc": 65, "muac": 65, "snif": 65, "glup": 65, "hip": 65, "puaj": 65, "ecs": 65, "arg": 65,
      "zis zas": 85, "tris tras": 85, "pif paf": 85, "pim pam": 85, "pim pam pum": 85, "rataplan": 85, "tarara": 85, "tururu": 85, "tutu": 85, "chinchin": 85, "fru fru": 85, "chas chas": 85, "tris": 85, "tras": 85, "pif": 85, "bubu": 85, "clo clo": 85, "co co": 85, "cucu": 85, "uh uh": 85, "auuu": 85, "grrr": 85, "ron ron": 85, "ric rac": 85, "ñic": 85, "ñiqui ñiqui": 85,
      "pataplum": 100, "frufru": 100, "tarari": 100, "chaf": 100, "tararatata": 100, "cataplun": 100, "patatin": 100, "patatan": 100, "taratachin": 100, "tantarantan": 100, "chischas": 100, "tristras": 100, "ziszas": 100, "arrorro": 100
    }
  },
  {
    id: "pal-015", pack: "palabras",
    texto: "Sinónimo en español de «engaño», «estafa» o «mentira»",
    ejemplo: "artilugio",
    answers: {
      "timo": 10, "fraude": 10, "mentira": 10, "engaño": 10, "estafa": 10, "trampa": 10, "bulo": 10, "embuste": 10, "trola": 10, "farsa": 10,
      "fake": 25, "fake news": 25, "scam": 25, "phishing": 25, "clickbait": 25, "spam": 25, "estafa piramidal": 25, "ponzi": 25, "humo": 25, "politica": 25, "promesa": 25, "ilusion": 25, "cuento chino": 25, "ficcion": 25,
      "cuento": 45, "patraña": 45, "bola": 45, "camelo": 45, "enredo": 45, "chanchullo": 45, "artimaña": 45, "infundio": 45, "falacia": 45, "embrollo": 45, "pilleria": 45, "tocomocho": 45, "sisa": 45, "milonga": 45, "invencion": 45, "ardid": 45, "celada": 45, "triquiñuela": 45, "jugarreta": 45, "treta": 45, "truco": 45, "fantasmada": 45, "farol": 45, "chorizada": 45, "robo": 45, "atraco": 45, "sablazo": 45, "clavada": 45, "palo": 45, "pufo": 45, "tongo": 45, "amaño": 45, "apaño": 45, "montaje": 45, "paripe": 45, "teatro": 45, "comedia": 45, "pantomima": 45, "simulacro": 45, "impostura": 45, "falsedad": 45, "calumnia": 45,
      "engatuse": 65, "tangana": 65, "pega": 65, "chicana": 65, "argucia": 65, "trapisonda": 65, "trinquete": 65, "embuchado": 65, "gatuperio": 65, "tramoya": 65, "tangada": 65, "doblaje": 65, "estampita": 65, "pelotazo": 65, "corruptela": 65, "mordida": 65, "cohecho": 65, "desfalco": 65, "malversacion": 65, "usurpacion": 65, "suplantacion": 65, "falsificacion": 65, "simulacion": 65, "fingimiento": 65, "supercheria": 65, "charlataneria": 65, "fulleria": 65, "picardia": 65, "granujada": 65, "canallada": 65, "encerrona": 65, "emboscada": 65, "añagaza": 65, "maraña": 65, "chiringuito": 65, "mamandurria": 65, "difamacion": 65, "hipocresia": 65,
      "insidia": 85, "dolo": 85, "perfidia": 85, "alevosia": 85, "maquinacion": 85, "faramalla": 85, "embaucamiento": 85, "sollado": 85, "subterfugio": 85, "estratagema": 85, "asechanza": 85, "acechanza": 85, "mistificacion": 85, "mixtificacion": 85, "fabula": 85, "quimera": 85, "paparrucha": 85, "habladuria": 85, "infamia": 85, "mendacidad": 85, "duplicidad": 85, "doblez": 85, "felonia": 85, "intriga": 85, "conjura": 85, "complot": 85, "confabulacion": 85,
      "artilugio": 100, "engaitamiento": 100, "socaliña": 100, "zaragatero": 100, "engañifa": 100, "engañabobos": 100, "mohatra": 100, "barateria": 100, "estelionato": 100, "camama": 100, "filfa": 100, "andromina": 100, "embeleco": 100, "trapaza": 100
    }
  },
  {
    id: "pal-016", pack: "palabras",
    texto: "Palabra del castellano que empiece por la letra «Z»",
    ejemplo: "zamarra",
    answers: {
      "zapato": 10, "zanahoria": 10, "zumo": 10, "zorro": 10, "zona": 10, "zoo": 10, "zoologico": 10, "zurdo": 10, "zarza": 10, "zapatilla": 10,
      "zeta": 25, "zombie": 25, "zombi": 25, "zoom": 25, "zen": 25, "zero": 25, "zaragoza": 25, "zamora": 25, "zarauz": 25, "zara": 25, "zelda": 25, "zeus": 25, "zoro": 25, "zumo de naranja": 25,
      "zueco": 45, "zafiro": 45, "zumbido": 45, "zumbar": 45, "zagal": 45, "zarzuela": 45, "zarzamora": 45, "zancada": 45, "zancadilla": 45, "zanco": 45, "zaguero": 45, "zaguan": 45, "zalamero": 45, "zarpa": 45, "zarpazo": 45, "zumbador": 45, "zambomba": 45, "zascandil": 45, "zoquete": 45, "zopenco": 45, "zepelin": 45, "zulo": 45, "zurron": 45, "zafarrancho": 45, "zanja": 45, "zarandear": 45, "zarandeo": 45, "zambullida": 45, "zambullir": 45, "zampar": 45, "zampabollos": 45, "zangano": 45, "zancudo": 45, "zapatero": 45, "zapateria": 45, "zapateado": 45, "zar": 45, "zarina": 45, "zafarse": 45, "zafar": 45, "zocalo": 45, "zodiaco": 45, "zumbon": 45,
      "zoco": 65, "zalea": 65, "zamarra": 65, "zanganear": 65, "zarabanda": 65, "zaleo": 65, "zalameria": 65, "zozobra": 65, "zozobrar": 65, "zarrapastroso": 65, "zaragatear": 65, "zootecnia": 65, "zoologia": 65, "zoologo": 65, "zoonosis": 65, "zigurat": 65, "zigzag": 65, "zigzaguear": 65, "zinc": 65, "zircon": 65, "zirconio": 65, "zopilote": 65, "zorzal": 65, "zorrilla": 65, "zorruno": 65, "zorrera": 65, "zampoña": 65, "zahareño": 65, "zaherir": 65, "zahori": 65, "zahurda": 65, "zalema": 65, "zamacuco": 65, "zamarrear": 65, "zamarreo": 65, "zapador": 65, "zaragata": 65, "zaraguelles": 65, "zaranda": 65,
      "zagual": 85, "zanquilargo": 85, "zarracina": 85, "zurriagazo": 85, "zurriago": 85, "zurrapa": 85, "zurrumbico": 85, "zascandilear": 85, "zapoteco": 85, "zatico": 85, "zopencada": 85, "zurcir": 85, "zurcido": 85, "zurrar": 85, "zurra": 85, "zumacal": 85, "zumaque": 85, "zumbel": 85, "zuñir": 85, "zuñido": 85, "zaida": 85, "zaino": 85, "zalagarda": 85, "zambra": 85, "zaraza": 85,
      "zampatortas": 100, "zaragutear": 100, "zurcefayas": 100, "zamarrico": 100, "zangolotino": 100, "zangolotear": 100, "zaquizami": 100, "zarramplin": 100, "zarzaparrilla": 100, "zocato": 100, "zollipar": 100, "zurumbatico": 100, "zuzon": 100
    }
  },
  /* ===================== PROMPTS DE PRUEBA DE LOS PACKS TEMÁTICOS ===================== */
  {
    id: "pal-001", pack: "palabras",
    texto: "Algo que se puede romper",
    ejemplo: "enlace covalente",
    answers: {
      "vaso": 10, "plato": 10, "corazon": 10, "el corazon": 10, "espejo": 10, "hueso": 10, "cristal": 10, "pantalla": 10,
      "silencio": 25, "el silencio": 25, "hielo": 25, "el hielo": 25, "promesa": 25, "record": 25, "regla": 25, "las reglas": 25, "ley": 25, "la ley": 25, "rutina": 25, "confianza": 25, "amistad": 25, "dieta": 25, "hucha": 25, "pacto": 25,
      "ventana": 45, "copa": 45, "taza": 45, "botella": 45, "jarron": 45, "huevo": 45, "gafas": 45, "movil": 45, "telefono": 45, "cuerda": 45, "cadena": 45, "lapiz": 45, "papel": 45, "silla": 45, "mesa": 45, "puerta": 45, "juguete": 45, "muñeca": 45, "globo": 45, "paraguas": 45, "reloj": 45, "diente": 45, "muela": 45, "uña": 45, "pierna": 45, "brazo": 45, "costilla": 45, "tobillo": 45, "nariz": 45, "cadera": 45, "clavicula": 45, "pantalon": 45, "media": 45, "cremallera": 45, "tacon": 45, "coche": 45, "motor": 45, "ordenador": 45, "televisor": 45, "bombilla": 45, "llave": 45, "rama": 45, "piñata": 45, "nuez": 45, "ola": 45, "aguas": 45,
      "ligamento": 65, "ligamento cruzado": 65, "menisco": 65, "tendon": 65, "tendon de aquiles": 65, "tibia": 65, "perone": 65, "femur": 65, "rotula": 65, "timpano": 65, "tabique": 65, "tabique nasal": 65, "fibras": 65, "contrato": 65, "matrimonio": 65, "relacion": 65, "compromiso": 65, "juramento": 65, "tregua": 65, "alianza": 65, "tratado": 65, "huelga": 65, "empate": 65, "racha": 65, "saque": 65, "servicio": 65, "embrague": 65, "freno": 65, "caja de cambios": 65, "parabrisas": 65, "retrovisor": 65, "radiador": 65, "correa de distribucion": 65, "tuberia": 65, "cañeria": 65, "porcelana": 65, "ceramica": 65, "secreto": 65, "maldicion": 65, "hechizo": 65, "galleta napolitana": 65, "napolitana": 65,
      "cigueñal": 85, "biela": 85, "junta de culata": 85, "culata": 85, "palier": 85, "transmision": 85, "carter": 85, "embargo": 85, "bloqueo": 85, "cerco": 85, "protocolo": 85, "relaciones diplomaticas": 85, "cadena de custodia": 85, "cadena de frio": 85, "barrera del sonido": 85, "cuarta pared": 85, "la cuarta pared": 85, "simetria": 85, "monopolio": 85, "tabu": 85, "dogma": 85, "cuarzo": 85, "obsidiana": 85, "escafoides": 85, "aneurisma": 85,
      "paradigma": 100, "enlace covalente": 100, "tension superficial": 100, "simetria espontanea": 100, "homeostasis": 100, "permafrost": 100, "falla geologica": 100, "puente de hidrogeno": 100, "cifrado": 100, "omerta": 100, "quorum": 100, "concordato": 100
    }
  },
  {
    id: "pal-002", pack: "palabras",
    texto: "Un animal que empiece por C",
    ejemplo: "celacanto",
    answers: {
      "caballo": 10, "conejo": 10, "cabra": 10, "cerdo": 10, "camello": 10, "cebra": 10, "cocodrilo": 10, "canguro": 10,
      "can": 25, "chucho": 25, "cachorro": 25, "camaleon": 25, "cucaracha": 25, "capibara": 25, "carpincho": 25, "cangrejo": 25, "caracol": 25, "caballito de mar": 25, "cuervo": 25, "cisne": 25, "colibri": 25, "cigueña": 25, "canario": 25, "castor": 25,
      "ciervo": 45, "corzo": 45, "carnero": 45, "cordero": 45, "cochino": 45, "chancho": 45, "chivo": 45, "cobaya": 45, "cuy": 45, "chimpance": 45, "coyote": 45, "chacal": 45, "comadreja": 45, "conejo de indias": 45, "calamar": 45, "camaron": 45, "cigala": 45, "centollo": 45, "coquina": 45, "chirla": 45, "cachalote": 45, "carpa": 45, "congrio": 45, "caballa": 45, "cazon": 45, "corvina": 45, "codorniz": 45, "cotorra": 45, "cacatua": 45, "condor": 45, "cuco": 45, "cobra": 45, "cascabel": 45, "culebra": 45, "caiman": 45, "ciempies": 45, "cochinilla": 45, "cigarra": 45, "chicharra": 45, "chinche": 45, "ciervo volante": 45, "coral": 45,
      "chinchilla": 65, "coati": 65, "caracal": 65, "civeta": 65, "caribu": 65, "cabra montes": 65, "cormoran": 65, "cernicalo": 65, "carabo": 65, "chova": 65, "carbonero": 65, "curruca": 65, "cogujada": 65, "chocha": 65, "chorlitejo": 65, "correlimos": 65, "cigueñuela": 65, "calamon": 65, "cascanueces": 65, "camachuelo": 65, "colirrojo": 65, "chochin": 65, "cerceta": 65, "cangrejo ermitaño": 65, "cangrejo herradura": 65, "calamar gigante": 65, "carabela portuguesa": 65, "caballito del diablo": 65, "crisopa": 65, "carcoma": 65, "cantarida": 65, "camaron mantis": 65, "caniche": 65, "chihuahua": 65, "carlino": 65, "chow chow": 65, "chowchow": 65, "cocker": 65, "collie": 65,
      "casuario": 85, "cuscus": 85, "colugo": 85, "cacomixtle": 85, "coatimundi": 85, "cebu": 85, "cudu": 85, "corzuela": 85, "colobo": 85, "cercopiteco": 85, "capuchino": 85, "chiru": 85, "cuon": 85, "culpeo": 85, "chungungo": 85, "cangrejo de los cocoteros": 85, "cangrejo yeti": 85, "calamar vampiro": 85, "cerdo hormiguero": 85, "cerdo de mar": 85, "camaleon pantera": 85, "clamidosaurio": 85, "cecilia": 85, "caracara": 85,
      "celacanto": 100, "cagu": 100, "cariama": 100, "chuña": 100, "coscoroba": 100, "cotinga": 100, "chachalaca": 100, "colin de virginia": 100, "ciervo raton": 100, "cefalofo": 100, "condiluro": 100, "ctenoforo": 100, "crinoideo": 100, "criptobranquio": 100
    }
  },
  {
    id: "pel-001", pack: "peliculas",
    texto: "Una película de Disney",
    ejemplo: "ichabod y el señor sapo",
    answers: {
      "el rey leon": 10, "rey leon": 10, "frozen": 10, "aladdin": 10, "aladin": 10, "la sirenita": 10, "sirenita": 10, "la bella y la bestia": 10, "bella y la bestia": 10, "blancanieves": 10, "cenicienta": 10, "la cenicienta": 10,
      "toy story": 25, "buscando a nemo": 25, "cars": 25, "monstruos sa": 25, "up": 25, "wall e": 25, "walle": 25, "los increibles": 25, "increibles": 25, "ratatouille": 25, "coco": 25, "del reves": 25, "inside out": 25, "piratas del caribe": 25, "high school musical": 25, "camp rock": 25, "hannah montana": 25, "mary poppins": 25, "fantasia": 25,
      "mulan": 45, "dumbo": 45, "bambi": 45, "pinocho": 45, "peter pan": 45, "tarzan": 45, "hercules": 45, "pocahontas": 45, "vaiana": 45, "moana": 45, "encanto": 45, "enredados": 45, "zootropolis": 45, "zootopia": 45, "lilo y stitch": 45, "el libro de la selva": 45, "libro de la selva": 45, "101 dalmatas": 45, "ciento un dalmatas": 45, "la dama y el vagabundo": 45, "dama y el vagabundo": 45, "la bella durmiente": 45, "bella durmiente": 45, "alicia en el pais de las maravillas": 45, "los aristogatos": 45, "aristogatos": 45, "robin hood": 45, "el jorobado de notre dame": 45, "jorobado de notre dame": 45, "brave": 45, "indomable": 45, "big hero 6": 45, "rompe ralph": 45, "bichos": 45, "soul": 45, "luca": 45, "red": 45, "elemental": 45,
      "el emperador y sus locuras": 65, "emperador y sus locuras": 65, "hermano oso": 65, "atlantis": 65, "atlantis el imperio perdido": 65, "el planeta del tesoro": 65, "planeta del tesoro": 65, "tiana y el sapo": 65, "merlin el encantador": 65, "tod y toby": 65, "bolt": 65, "chicken little": 65, "dinosaurio": 65, "raya y el ultimo dragon": 65, "wish": 65, "onward": 65, "el viaje de arlo": 65, "ralph rompe internet": 65, "buscando a dory": 65, "monstruos university": 65, "lightyear": 65, "malefica": 65, "cruella": 65, "encantada": 65, "tu a londres y yo a california": 65, "princesa por sorpresa": 65, "ponte en mi lugar": 65, "el retorno de las brujas": 65, "hocus pocus": 65, "pesadilla antes de navidad": 65, "cariño he encogido a los niños": 65, "flubber": 65, "george de la jungla": 65, "la busqueda": 65, "tron": 65, "tron legacy": 65, "las cronicas de narnia": 65,
      "zafarrancho en el rancho": 85, "descubriendo a los robinsons": 85, "los rescatadores": 85, "rescatadores": 85, "los rescatadores en cangurolandia": 85, "bernardo y bianca": 85, "oliver y su pandilla": 85, "policias y ratones": 85, "basil el raton superdetective": 85, "taron y el caldero magico": 85, "la bruja novata": 85, "bruja novata": 85, "pedro y el dragon elliot": 85, "fantasia 2000": 85, "mundo extraño": 85, "un puente hacia terabithia": 85, "colmillo blanco": 85, "bajo cero": 85, "somos los mejores": 85, "herbie": 85, "ahi va ese bolido": 85, "la mansion encantada": 85, "inspector gadget": 85, "sky high": 85, "john carter": 85, "tomorrowland": 85, "jungle cruise": 85,
      "los tres caballeros": 100, "tres caballeros": 100, "saludos amigos": 100, "musica maestro": 100, "tiempo de melodia": 100, "diversion y fantasia": 100, "las aventuras de ichabod y el señor sapo": 100, "ichabod y el señor sapo": 100, "el abismo negro": 100, "abismo negro": 100, "el vuelo del navegante": 100, "oz un mundo fantastico": 100, "20000 leguas de viaje submarino": 100, "los robinsones de los mares del sur": 100, "la montaña embrujada": 100
    }
  },
  {
    id: "pel-002", pack: "peliculas",
    texto: "Una película que transcurra en el mar",
    ejemplo: "el acorazado potemkin",
    answers: {
      "titanic": 10, "tiburon": 10, "piratas del caribe": 10, "buscando a nemo": 10, "la sirenita": 10, "sirenita": 10, "naufrago": 10, "vaiana": 10, "moana": 10,
      "aquaman": 25, "avatar el sentido del agua": 25, "el sentido del agua": 25, "bob esponja": 25, "bob esponja la pelicula": 25, "buscando a dory": 25, "el espantatiburones": 25, "espantatiburones": 25, "liberad a willy": 25, "megalodon": 25, "the meg": 25, "sharknado": 25, "luca": 25, "ponyo": 25, "ponyo en el acantilado": 25, "atlantis": 25, "mar adentro": 25,
      "la vida de pi": 45, "vida de pi": 45, "la tormenta perfecta": 45, "tormenta perfecta": 45, "capitan phillips": 45, "waterworld": 45, "master and commander": 45, "moby dick": 45, "poseidon": 45, "la aventura del poseidon": 45, "20000 leguas de viaje submarino": 45, "veinte mil leguas de viaje submarino": 45, "el lago azul": 45, "lago azul": 45, "la playa": 45, "infierno azul": 45, "the shallows": 45, "a 47 metros": 45, "deep blue sea": 45, "tiburon 2": 45, "megalodon 2": 45, "en el corazon del mar": 45, "robinson crusoe": 45, "la isla del tesoro": 45, "isla del tesoro": 45, "simbad": 45, "simbad la leyenda de los siete mares": 45, "dunkerque": 45, "pearl harbor": 45, "battleship": 45, "locos por el surf": 45, "le llaman bodhi": 45, "point break": 45, "soul surfer": 45, "flipper": 45, "el triangulo de la tristeza": 45, "triangulo de la tristeza": 45,
      "la caza del octubre rojo": 65, "octubre rojo": 65, "das boot": 65, "el submarino": 65, "marea roja": 65, "u 571": 65, "u571": 65, "k 19": 65, "k19": 65, "hunter killer": 65, "greyhound": 65, "greyhound enemigos bajo el mar": 65, "abyss": 65, "the abyss": 65, "el abismo": 65, "esfera": 65, "sphere": 65, "underwater": 65, "leviathan": 65, "ghost ship": 65, "barco fantasma": 65, "open water": 65, "a la deriva": 65, "adrift": 65, "cuando todo esta perdido": 65, "all is lost": 65, "kon tiki": 65, "kontiki": 65, "el gran azul": 65, "le grand bleu": 65, "oceanos": 65, "calma total": 65, "dead calm": 65, "triangle": 65, "el triangulo": 65, "rebelion a bordo": 65, "motin a bordo": 65, "capitanes intrepidos": 65, "la isla de las cabezas cortadas": 65, "la isla de nim": 65, "el monstruo marino": 65,
      "el faro": 85, "the lighthouse": 85, "life aquatic": 85, "el ultimo viaje del demeter": 85, "el señor de las moscas": 85, "señor de las moscas": 85, "tormenta blanca": 85, "white squall": 85, "la hora decisiva": 85, "the finest hours": 85, "kursk": 85, "black sea": 85, "mar negro": 85, "el canto del lobo": 85, "operacion pacifico": 85, "duelo en el atlantico": 85, "hundid el bismarck": 85, "el viejo y el mar": 85, "viejo y el mar": 85, "orca la ballena asesina": 85, "orca": 85, "piraña": 85, "deep rising": 85, "virus": 85, "el motin del caine": 85, "motin del caine": 85, "billy budd": 85, "los niños del mar": 85,
      "el acorazado potemkin": 100, "acorazado potemkin": 100, "blackfish": 100, "the cove": 100, "mi maestro el pulpo": 100, "el mundo del silencio": 100, "leviatan": 100, "stromboli": 100, "los contrabandistas de moonfleet": 100, "moonfleet": 100, "naufragos": 100, "el navegante": 100, "tabu": 100, "el gran miercoles": 100
    }
  },
  {
    id: "dep-001", pack: "deportes",
    texto: "Un deporte que se juegue con red",
    ejemplo: "jianzi",
    answers: {
      "tenis": 10, "voleibol": 10, "voley": 10, "volei": 10, "padel": 10, "badminton": 10, "ping pong": 10, "tenis de mesa": 10,
      "futbol": 25, "baloncesto": 25, "basket": 25, "balonmano": 25, "waterpolo": 25, "hockey": 25, "futbol sala": 25, "futsal": 25, "hockey sobre hielo": 25, "hockey hielo": 25, "hockey hierba": 25, "hockey sobre hierba": 25, "hockey patines": 25, "hockey sobre patines": 25, "pesca": 25, "pesca deportiva": 25, "pesca con caña": 25, "pingpong": 25, "pin pon": 25,
      "volei playa": 45, "voley playa": 45, "voleibol playa": 45, "voleibol de playa": 45, "beach voley": 45, "tenis playa": 45, "tenis de playa": 45, "beach tennis": 45, "pickleball": 45, "futvoley": 45, "futvolei": 45, "footvolley": 45, "futbol tenis": 45, "futtenis": 45, "frontenis": 45, "tenis en silla de ruedas": 45, "tenis silla de ruedas": 45, "voleibol sentado": 45, "minitenis": 45, "mini tenis": 45, "minivoley": 45, "tenis individual": 45, "tenis dobles": 45, "lacrosse": 45, "futbol playa": 45, "balonmano playa": 45, "baloncesto 3x3": 45, "basket 3x3": 45, "polo": 45, "hockey linea": 45, "hockey en linea": 45, "padbol": 45, "teqball": 45, "netball": 45,
      "sepak takraw": 65, "takraw": 65, "bossaball": 65, "roundnet": 65, "spikeball": 65, "badminton adaptado": 65, "parabadminton": 65, "para badminton": 65, "paratenis de mesa": 65, "tenis de mesa adaptado": 65, "tenis adaptado": 65, "padel en silla de ruedas": 65, "padel adaptado": 65, "touchtennis": 65, "touch tennis": 65, "soft tennis": 65, "tenis blando": 65, "speed badminton": 65, "crossminton": 65, "indiaca": 65, "peteca": 65, "fistball": 65, "faustball": 65, "punhobol": 65, "puñobol": 65, "squash tennis": 65, "korfball": 65, "korfbal": 65, "balonkorf": 65, "floorball": 65, "unihockey": 65, "kayak polo": 65, "piragua polo": 65, "tchoukball": 65, "wallyball": 65, "ecuavoley": 65, "cachibol": 65, "newcomb": 65, "voley nieve": 65, "voleibol de nieve": 65,
      "jeu de paume": 85, "real tennis": 85, "tenis real": 85, "xare": 85, "share": 85, "teqvoly": 85, "teqis": 85, "teqpong": 85, "padel playa": 85, "jorkyball": 85, "headis": 85, "air badminton": 85, "airbadminton": 85, "tenis para ciegos": 85, "mintonette": 85, "hooverball": 85, "biribol": 85, "acuavoley": 85, "voleibol acuatico": 85, "footbag net": 85, "jokgu": 85, "bandy": 85, "ringette": 85, "hockey subacuatico": 85, "bikepolo": 85, "ciclopolo": 85, "cestoball": 85,
      "jianzi": 100, "pluma": 100, "shuttlecock": 100, "battledore": 100, "qianball": 100, "speed ball": 100, "prellball": 100, "throwball": 100, "ball badminton": 100, "sipa": 100, "chinlone": 100, "ringtennis": 100, "tennikoit": 100, "deck tennis": 100, "featherball": 100
    }
  },
  {
    id: "geo-001", pack: "geografia",
    texto: "Un río de Europa",
    ejemplo: "pechora",
    answers: {
      "tajo": 10, "ebro": 10, "guadalquivir": 10, "duero": 10, "danubio": 10, "rin": 10, "rhin": 10, "sena": 10, "tamesis": 10,
      "manzanares": 25, "turia": 25, "nervion": 25, "llobregat": 25, "tinto": 25, "rio tinto": 25, "po": 25, "tiber": 25, "arno": 25, "rubicon": 25, "ural": 25, "sella": 25, "eo": 25, "bidasoa": 25,
      "miño": 45, "guadiana": 45, "jucar": 45, "segura": 45, "genil": 45, "sil": 45, "pisuerga": 45, "esla": 45, "tormes": 45, "jarama": 45, "henares": 45, "tajuña": 45, "alberche": 45, "tietar": 45, "jerte": 45, "segre": 45, "cinca": 45, "gallego": 45, "jalon": 45, "ter": 45, "nalon": 45, "narcea": 45, "navia": 45, "cares": 45, "deva": 45, "pas": 45, "guadalete": 45, "odiel": 45, "guadalhorce": 45, "mundo": 45, "volga": 45, "loira": 45, "rodano": 45, "garona": 45, "elba": 45, "oder": 45, "vistula": 45, "dnieper": 45, "don": 45, "moldava": 45,
      "guadaira": 65, "guadiaro": 65, "barbate": 65, "almanzora": 65, "andarax": 65, "vinalopo": 65, "mijares": 65, "palancia": 65, "cabriel": 65, "zancara": 65, "ciguela": 65, "guadarrama": 65, "eresma": 65, "adaja": 65, "duraton": 65, "arlanza": 65, "arlanzon": 65, "carrion": 65, "orbigo": 65, "alagon": 65, "tambre": 65, "ulla": 65, "lerez": 65, "urumea": 65, "oria": 65, "arga": 65, "aragon": 65, "besaya": 65, "ason": 65, "mosa": 65, "escalda": 65, "mosela": 65, "main": 65, "meno": 65, "neckar": 65, "spree": 65, "inn": 65, "adigio": 65, "ticino": 65, "shannon": 65, "severn": 65,
      "aar": 85, "aare": 85, "reuss": 85, "dordoña": 85, "marne": 85, "somme": 85, "sava": 85, "drava": 85, "tisa": 85, "tisza": 85, "morava": 85, "neretva": 85, "drina": 85, "vardar": 85, "maritsa": 85, "prut": 85, "dniester": 85, "niemen": 85, "daugava": 85, "dvina": 85, "neva": 85, "vltava": 85, "bug": 85, "warta": 85, "liffey": 85, "curueño": 85, "omaña": 85,
      "pechora": 100, "kama": 100, "oka": 100, "onega": 100, "mezen": 100, "narva": 100, "torne": 100, "kemijoki": 100, "glomma": 100, "gota": 100, "klaralven": 100, "thjorsa": 100, "hvita": 100, "vjosa": 100, "cañamares": 100
    }
  },
  {
    id: "mus-001", pack: "musica",
    texto: "Un instrumento de cuerda",
    ejemplo: "nyckelharpa",
    answers: {
      "guitarra": 10, "violin": 10, "piano": 10, "arpa": 10, "bajo": 10, "bajo electrico": 10, "bajoelectrico": 10, "guitarra electrica": 10, "guitarraelectrica": 10, "guitarra española": 10, "guitarraespañola": 10, "guitarra acustica": 10, "guitarraacustica": 10, "guitarra clasica": 10, "guitarraclasica": 10,
      "ukelele": 25, "ukulele": 25, "contrabajo": 25, "violonchelo": 25, "violoncelo": 25, "chelo": 25, "cello": 25, "laud": 25, "mandolina": 25, "voz": 25, "cuerdas vocales": 25, "cuerdasvocales": 25, "guitarra flamenca": 25, "guitarraflamenca": 25, "piano de cola": 25, "pianodecola": 25, "arpa celtica": 25,
      "viola": 45, "banjo": 45, "sitar": 45, "clavicordio": 45, "clave": 45, "clavecin": 45, "bandurria": 45, "vihuela": 45, "lira": 45, "balalaika": 45, "timple": 45, "timple canario": 45, "timplecanario": 45, "charango": 45, "citara": 45, "espineta": 45, "salterio": 45, "dulcimer": 45, "dulcemele": 45, "guitalele": 45, "tres cubano": 45, "trescubano": 45, "cuatro venezolano": 45, "cuatro": 45, "cavaquinho": 45, "cavaco": 45, "guitarron": 45, "requinto": 45,
      "guzheng": 65, "zheng": 65, "koto": 65, "erhu": 65, "buzuki": 65, "bouzouki": 65, "guitarro": 65, "shamisen": 65, "pipa": 65, "biwa": 65, "sanxian": 65, "gayageum": 65, "komungo": 65, "oud": 65, "ud": 65, "saz": 65, "baglama": 65, "tanbur": 65, "domra": 65, "dutar": 65, "rubab": 65, "rebab": 65, "morin khuur": 65, "morinkhuur": 65, "sarangi": 65, "sarod": 65, "veena": 65, "santur": 65, "kanun": 65, "cimbalom": 65, "pedal steel": 65, "lap steel": 65,
      "zanfona": 85, "zanfoña": 85, "hurdy gurdy": 85, "rabel": 85, "viola de gamba": 85, "violadegamba": 85, "viola da gamba": 85, "tiorba": 85, "laud renacentista": 85, "laudrenacentista": 85, "laud barroco": 85, "monocordio": 85, "kora": 85, "viola da braccio": 85, "viola de amor": 85, "viola d amore": 85, "trompeta marina": 85, "trompetamarina": 85, "citara de concierto": 85, "bandura": 85, "kobza": 85, "gusli": 85, "kantele": 85, "valiha": 85, "berimbau": 85, "tanpura": 85, "tar persa": 85,
      "nyckelharpa": 100, "chapman stick": 100, "chapmanstick": 100, "the stick": 100, "gravikord": 100, "yayli tanbur": 100, "yaylitanbur": 100, "clavicordio de pedal": 100, "clavicordiodepedal": 100, "hardingfele": 100, "violin de hardanger": 100, "esraj": 100, "dilruba": 100, "swarabat": 100, "kamancheh": 100, "kemenche": 100, "crwth": 100, "giga medieval": 100, "chitarra battente": 100, "archilaud": 100, "vihuela de arco": 100, "dan bau": 100, "kankles": 100, "kokle": 100, "ektara": 100
    }
  }
];
