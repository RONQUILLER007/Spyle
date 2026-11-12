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
  },
  4: {
    id: "dia_4",
    dia: 4,
    nombre: "Operación Cuadrante",
    fecha: "10 nov 2026",
    prompts: ["gen-027", "gen-028", "gen-022", "gen-023", "gen-024", "gen-025", "gen-026"],
    easterEgg: { promptId: "gen-027", word: "malaui" }
  },
  5: {
    id: "dia_5",
    dia: 5,
    nombre: "Operación Pentágono",
    fecha: "11 nov 2026",
    prompts: ["geo-001", "mus-001", "pal-001", "dep-001", "pel-002", "pel-001", "dep-002"]
  },
  6: {
    id: "dia_6",
    dia: 6,
    nombre: "Operación Sextante",
    fecha: "12 nov 2026",
    prompts: ["pal-002", "geo-002", "geo-003", "dep-003", "mus-003", "pel-003", "mus-002"]
  },
  7: {
    id: "dia_7",
    dia: 7,
    nombre: "Operación Septentrión",
    fecha: "13 nov 2026",
    prompts: ["pel-005", "mus-004", "pel-004", "geo-004", "pal-004", "dep-004", "pal-003"]
  },
  8: {
    id: "dia_8",
    dia: 8,
    nombre: "Operación Octógono",
    fecha: "14 nov 2026",
    prompts: ["mus-005", "pel-006", "pal-005", "geo-006", "geo-005", "dep-005", "dep-006"]
  },
  9: {
    id: "dia_9",
    dia: 9,
    nombre: "Operación Nono",
    fecha: "15 nov 2026",
    prompts: ["pal-007", "pel-007", "mus-007", "dep-007", "mus-006", "pal-006", "geo-007"]
  },
  10: {
    id: "dia_10",
    dia: 10,
    nombre: "Operación Decatlón",
    fecha: "16 nov 2026",
    prompts: ["pel-008", "dep-008", "geo-009", "geo-008", "mus-008", "pel-009", "pal-008"]
  },
  11: {
    id: "dia_11",
    dia: 11,
    nombre: "Operación Enclave",
    fecha: "17 nov 2026",
    prompts: ["geo-010", "dep-010", "pel-010", "pal-009", "dep-009", "mus-009", "mus-010"]
  },
  12: {
    id: "dia_12",
    dia: 12,
    nombre: "Operación Eclipse",
    fecha: "18 nov 2026",
    prompts: ["mus-011", "pal-010", "geo-011", "geo-012", "dep-011", "pal-011", "pel-011"]
  },
  13: {
    id: "dia_13",
    dia: 13,
    nombre: "Operación Tridente",
    fecha: "19 nov 2026",
    prompts: ["dep-012", "pel-013", "mus-013", "mus-012", "pal-012", "pel-012", "geo-013"]
  },
  14: {
    id: "dia_14",
    dia: 14,
    nombre: "Operación Baluarte",
    fecha: "20 nov 2026",
    prompts: ["pal-013", "mus-014", "dep-013", "pel-014", "pal-014", "dep-014", "geo-014"]
  },
  15: {
    id: "dia_15",
    dia: 15,
    nombre: "Operación Quimera",
    fecha: "21 nov 2026",
    prompts: ["mus-015", "pel-016", "pal-015", "pel-015", "dep-016", "geo-015", "dep-015"]
  },
  16: {
    id: "dia_16",
    dia: 16,
    nombre: "Operación Centinela",
    fecha: "22 nov 2026",
    prompts: ["geo-016", "mus-016", "dep-017", "geo-017", "pel-017", "mus-017", "pal-016"]
  },
  17: {
    id: "dia_17",
    dia: 17,
    nombre: "Operación Aurora",
    fecha: "23 nov 2026",
    prompts: ["dep-018", "mus-018", "pel-018", "pal-018", "geo-018", "pel-019", "pal-017"]
  },
  18: {
    id: "dia_18",
    dia: 18,
    nombre: "Operación Bastión",
    fecha: "24 nov 2026",
    prompts: ["pel-020", "dep-020", "pal-019", "geo-020", "mus-019", "geo-019", "dep-019"]
  },
  19: {
    id: "dia_19",
    dia: 19,
    nombre: "Operación Éxodo",
    fecha: "25 nov 2026",
    prompts: ["dep-021", "pal-021", "mus-020", "pel-021", "pal-020", "geo-021", "mus-021"]
  }
};
DAILY_MISSIONS.dia_1 = DAILY_MISSIONS[1];
DAILY_MISSIONS.dia_2 = DAILY_MISSIONS[2];
DAILY_MISSIONS.dia_3 = DAILY_MISSIONS[3];
DAILY_MISSIONS.dia_4 = DAILY_MISSIONS[4];
DAILY_MISSIONS.dia_5 = DAILY_MISSIONS[5];
DAILY_MISSIONS.dia_6 = DAILY_MISSIONS[6];
DAILY_MISSIONS.dia_7 = DAILY_MISSIONS[7];
DAILY_MISSIONS.dia_8 = DAILY_MISSIONS[8];
DAILY_MISSIONS.dia_9 = DAILY_MISSIONS[9];
DAILY_MISSIONS.dia_10 = DAILY_MISSIONS[10];
DAILY_MISSIONS.dia_11 = DAILY_MISSIONS[11];
DAILY_MISSIONS.dia_12 = DAILY_MISSIONS[12];
DAILY_MISSIONS.dia_13 = DAILY_MISSIONS[13];
DAILY_MISSIONS.dia_14 = DAILY_MISSIONS[14];
DAILY_MISSIONS.dia_15 = DAILY_MISSIONS[15];
DAILY_MISSIONS.dia_16 = DAILY_MISSIONS[16];
DAILY_MISSIONS.dia_17 = DAILY_MISSIONS[17];
DAILY_MISSIONS.dia_18 = DAILY_MISSIONS[18];
DAILY_MISSIONS.dia_19 = DAILY_MISSIONS[19];
if (typeof window !== "undefined") window.DAILY_MISSIONS = DAILY_MISSIONS;


const PROMPTS = [
  /* ===================== BLOQUE GENERAL 1 (14 prompts = 2 días) ===================== */
  {
    id: "gen-001", dailyId: "dia1-01", pack: "general",
    texto: "Marca de yogures o postres lácteos vendida en España",
    ejemplo: "sojasun",
    answers: {
      "danone": 10, "activia": 10, "actimel": 10, "danonino": 10, "nestle": 10, "la lechera": 10, "lechera": 10, "danet": 10, "pascual": 10, "vitalinea": 10, "oikos": 10, "yoplait": 10, "kaiku": 10, "puleva": 10, "central lechera asturiana": 10, "asturiana": 10, "dhul": 10, "reina": 10, "postres reina": 10, "clesa": 10,
      "hacendado": 25, "mercadona": 25, "milbona": 25, "lidl": 25, "carrefour": 25, "carrefour classic": 25, "carrefour bio": 25, "alcampo": 25, "auchan": 25, "dia": 25, "delicious dia": 25, "eroski": 25, "eroski seleqtia": 25, "consum": 25, "caprabo": 25, "bonpreu": 25, "bonarea": 25, "alteza": 25, "spar": 25, "gutbio": 25, "eliges": 25, "milsani": 25, "aldi": 25, "hipercor": 25, "el corte ingles": 25, "corte ingles": 25, "supercor": 25, "coviran": 25, "ahorramas": 25, "gadis": 25, "alimerka": 25, "yogur": 25, "yogurt": 25, "yoghourt": 25, "kefir": 25, "cuajada": 25, "natillas": 25, "flan": 25, "arroz con leche": 25, "petit suisse": 25, "petit": 25, "petisuis": 25, "griego": 25, "yogur griego": 25, "flan dhul": 25, "cacaolat": 25, "bifi": 25, "bifidus": 25, "copa": 25, "copa danone": 25, "mousse": 25, "proteinas": 25, "yogur de proteinas": 25, "petitsuise": 25, "danoninos": 25, "actimeles": 25, "activias": 25, "danets": 25, "natillas de vainilla": 25, "natillas de chocolate": 25, "natillas con galleta": 25, "flan de huevo": 25, "flan de vainilla": 25, "queso fresco": 25, "queso batido": 25, "queso burgos": 25, "queso de burgos": 25, "yogur natural": 25, "yogur de fresa": 25, "yogur de limon": 25, "yogur de coco": 25, "yogur de macedonia": 25, "yogur liquido": 25, "yogur para beber": 25, "yogur desnatado": 25, "yogur sin lactosa": 25, "yogur de soja": 25, "yogur vegetal": 25, "batido": 25, "batido puleva": 25, "batido pascual": 25, "batido de chocolate": 25, "batido de fresa": 25, "batido de vainilla": 25, "horchata": 25, "gelatina": 25, "gelatina royal": 25, "proteina mercadona": 25,
      "yopro": 45, "dalki": 45, "flanby": 45, "sveltesse": 45, "chiquitin": 45, "nesquik": 45, "kit kat": 45, "lion": 45, "smarties": 45, "milkybar": 45, "danup": 45, "densia": 45, "yolado": 45, "natillas danone": 45, "cuajada danone": 45, "yogikids": 45, "fage": 45, "chobani": 45, "alpro": 45, "ehrmann": 45, "lindahls": 45, "lindahls pro": 45, "arla": 45, "valio": 45, "feiraco": 45, "larsa": 45, "llet nostra": 45, "covap": 45, "fageda": 45, "la fageda": 45, "pastoret": 45, "kalise": 45, "lauki": 45, "flan chino mandarin": 45, "royal": 45, "muller": 45, "ram": 45, "chufi": 45, "vitalineas": 45, "flan de queso": 45, "tocino de cielo": 45, "panna cotta": 45, "panacota": 45, "tiramisu": 45, "profiteroles": 45, "lillas": 45, "petit choco": 45, "mi primer danone": 45, "yogur griego ligero": 45, "griego de stracciatella": 45, "stracciatella": 45, "horchata chufi": 45, "leche merengada": 45, "leche frita": 45, "natillas caseras": 45, "cuajada royal": 45, "gelatina reina": 45,
      "casa grande de xanceda": 65, "xanceda": 65, "postres montero": 65, "gaza": 65, "leche gaza": 65, "ato": 65, "deleite": 65, "leyma": 65, "celta": 65, "goshua": 65, "cantero de letur": 65, "el cantero de letur": 65, "sojasun": 65, "isey": 65, "isey skyr": 65, "skyr": 65, "myprotein": 65, "prozis": 65, "hsn": 65, "feastables": 65, "mrbeast": 65, "mr beast": 65, "prime": 65, "abbot kinney": 65, "savia": 65, "natursoy": 65, "sojade": 65, "andros": 65, "provamel": 65, "larra": 65, "mamia": 65, "ultzama": 65, "flan potax": 65, "burgalitos": 65,
      "granja badia": 85, "beteta": 85, "casa vieja": 85, "bico de xeado": 85, "lacturale": 85, "beyena": 85, "koralium": 85, "quesos cerrato": 85, "romar": 85, "postres romar": 85, "flan mandarin": 85, "potax": 85, "maizena": 85, "chambourcy": 85,
      "la ermita cantabria": 100, "postres la ermita": 100, "granja rinya": 100, "rinya": 100, "lacteos cobreros": 100, "casa amella": 100, "yosoy": 100
    }
  },
  {
    id: "gen-002", dailyId: "dia1-02", pack: "general",
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
    id: "gen-003", dailyId: "dia1-03", pack: "general",
    texto: "Municipio o ciudad de España que empiece por la letra «S»",
    ejemplo: "sot de chera",
    answers: {
      "sevilla": 10, "salamanca": 10, "santander": 10, "segovia": 10, "san sebastian": 10, "santiago de compostela": 10, "santiago": 10, "soria": 10, "donostia": 10,
      "sitges": 25, "salou": 25, "sanxenxo": 25, "santillana del mar": 25, "santillana": 25, "sotogrande": 25, "santa cruz de tenerife": 25, "santa cruz": 25, "sanlucar de barrameda": 25, "sanlucar": 25, "sagunto": 25, "san sebastian de los reyes": 25, "sanse": 25, "somo": 25, "suances": 25, "sierra nevada": 25, "sant feliu": 25, "santa coloma": 25,
      "sabadell": 45, "san fernando": 45, "santa pola": 45, "sepulveda": 45, "siguenza": 45, "sant cugat del valles": 45, "sant cugat": 45, "santurtzi": 45, "sestao": 45, "san javier": 45, "san vicente del raspeig": 45, "san lorenzo de el escorial": 45, "san lorenzo": 45, "segorbe": 45, "santoña": 45, "sarria": 45, "sanguesa": 45, "sallent": 45, "sant feliu de guixols": 45, "santa coloma de gramenet": 45, "sueca": 45, "sax": 45, "san pedro del pinatar": 45, "san roque": 45, "santa brigida": 45, "santa lucia de tirajana": 45, "san bartolome de tirajana": 45, "san bartolome": 45, "santa eulalia": 45, "sant antoni": 45, "sant antoni de portmany": 45, "sils": 45, "salt": 45, "sedavi": 45, "silla": 45, "son servera": 45, "santanyi": 45, "sineu": 45, "soller": 45, "ses salines": 45, "sabinanigo": 45, "sahagun": 45, "salas": 45,
      "sos del rey catolico": 65, "sotillo de la adrada": 65, "santo domingo de silos": 65, "santo domingo de la calzada": 65, "simancas": 65, "sort": 65, "san cristobal de la laguna": 65, "la laguna": 65, "san juan de aznalfarache": 65, "san juan de alicante": 65, "san martin de la vega": 65, "san martin de valdeiglesias": 65, "san agustin del guadalix": 65, "san fernando de henares": 65, "san mateo": 65, "san esteban de gormaz": 65, "santa fe": 65, "santa comba": 65, "santiago del teide": 65, "sacedon": 65, "seseña": 65, "socuellamos": 65, "sonseca": 65, "soto del real": 65, "sevilla la nueva": 65, "san vicente de la barquera": 65, "san vicente de alcantara": 65, "sariñena": 65, "setenil de las bodegas": 65, "setenil": 65, "somiedo": 65, "suria": 65, "sallent de gallego": 65, "sasamon": 65, "sant carles de la rapita": 65, "la rapita": 65,
      "serradilla": 85, "serrejon": 85, "sot de chera": 85, "senija": 85, "siete iglesias de trabancos": 85, "sotillo de la ribera": 85, "sopeira": 85, "sotres": 85, "samaniego": 85, "santurde": 85, "santurdejo": 85, "santorcaz": 85, "santa colomba de somoza": 85, "santa maria del campo": 85, "santa maria de cayon": 85, "santibañez de la sierra": 85, "santibañez de vidriales": 85, "santed": 85, "saravillo": 85, "sariego": 85, "sartaguda": 85, "sesma": 85, "sotorribas": 85, "sobradel": 85, "sobradiel": 85, "solsona": 85, "soses": 85, "suflia": 85,
      "sot de ferrer": 100, "senes de alcubierre": 100, "senes": 100, "seron": 100, "salillas": 100, "salillas de jalon": 100, "salvatierra de esca": 100, "santa cruz de moya": 100, "san vicente de arevalo": 100, "sariegos": 100
    }
  },
  {
    id: "gen-004", dailyId: "dia1-04", pack: "general",
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
    id: "gen-005", dailyId: "dia1-05", pack: "general",
    texto: "Marca de automóviles (desde generalistas hasta artesanales o desaparecidas)",
    ejemplo: "hurtan",
    easterEgg: "delorean",
    answers: {
      "seat": 10, "renault": 10, "ford": 10, "volkswagen": 10, "vw": 10, "toyota": 10, "bmw": 10, "mercedes": 10, "mercedes benz": 10, "audi": 10, "peugeot": 10, "citroen": 10, "opel": 10, "fiat": 10, "nissan": 10, "hyundai": 10, "kia": 10, "honda": 10,
      "ferrari": 25, "lamborghini": 25, "tesla": 25, "rolls royce": 25, "bentley": 25, "porsche": 25, "bugatti": 25, "mclaren": 25, "maserati": 25, "aston martin": 25, "delorean": 25, "lotus": 25,
      "skoda": 45, "dacia": 45, "mazda": 45, "suzuki": 45, "mitsubishi": 45, "volvo": 45, "jeep": 45, "land rover": 45, "mini": 45, "smart": 45, "alfa romeo": 45, "lancia": 45, "chevrolet": 45, "cupra": 45, "lexus": 45, "subaru": 45, "jaguar": 45, "saab": 45, "chrysler": 45, "dodge": 45, "daewoo": 45, "abarth": 45, "alpine": 45, "ds": 45, "infiniti": 45,
      "byd": 65, "omoda": 65, "jaecoo": 65, "xiaomi": 65, "mg": 65, "morris garages": 65, "polestar": 65, "lynk and co": 65, "lynk co": 65, "zeekr": 65, "xpeng": 65, "nio": 65, "seres": 65, "leapmotor": 65, "dr": 65, "dfsk": 65, "maxus": 65, "aiways": 65, "voyah": 65, "rover": 65, "ssangyong": 65, "kgm": 65, "daihatsu": 65, "isuzu": 65, "lada": 65, "trabant": 65, "cadillac": 65, "hummer": 65, "pontiac": 65, "simca": 65, "talbot": 65, "genesis": 65,
      "pegaso": 85, "santana": 85, "barreiros": 85, "hispano suiza": 85, "dkw": 85, "tvr": 85, "morgan": 85, "tata": 85, "mahindra": 85, "wiesmann": 85, "spyker": 85, "koenigsegg": 85, "pagani": 85, "de tomaso": 85, "borgward": 85, "tatra": 85, "zastava": 85, "yugo": 85, "moskvich": 85, "wartburg": 85, "plymouth": 85, "oldsmobile": 85, "buick": 85, "autobianchi": 85, "caterham": 85, "ariel": 85, "ssc": 85, "ssc north america": 85,
      "hurtan": 100, "gta spano": 100, "spano": 100, "tramontana": 100, "ebro": 100, "aixam": 100, "ligier": 100, "donkervoort": 100, "rimac": 100, "panoz": 100, "ginetta": 100, "comarth": 100, "microcar": 100, "bac": 100, "gumpert": 100, "noble": 100, "icona": 100
    }
  },
  {
    id: "gen-006", dailyId: "dia1-06", pack: "general",
    texto: "Película española ganadora del Goya a Mejor Película o muy taquillera",
    ejemplo: "arrebato",
    answers: {
      "ocho apellidos vascos": 10, "ocho apellidos catalanes": 10, "mar adentro": 10, "el orfanato": 10, "orfanato": 10, "los otros": 10, "volver": 10, "todo sobre mi madre": 10, "campeones": 10, "torrente": 10, "torrente el brazo tonto de la ley": 10, "el brazo tonto de la ley": 10, "lo imposible": 10, "la sociedad de la nieve": 10, "el laberinto del fauno": 10, "padre no hay mas que uno": 10, "la bola negra": 10, "bola negra": 10,
      "viridiana": 25, "el espiritu de la colmena": 25, "espiritu de la colmena": 25, "el verdugo": 25, "verdugo": 25, "bienvenido mister marshall": 25, "calle mayor": 25, "placido": 25, "la gran familia": 25, "gran familia": 25, "el pisito": 25, "pisito": 25, "amanece que no es poco": 25, "el hoyo": 25, "celda 211": 25, "rec": 25, "tesis": 25, "el dia de la bestia": 25, "airbag": 25, "mujeres al borde de un ataque de nervios": 25, "torrente presidente": 25,
      "los lunes al sol": 45, "belle epoque": 45, "la lengua de las mariposas": 45, "lengua de las mariposas": 45, "los santos inocentes": 45, "un monstruo viene a verme": 45, "abre los ojos": 45, "las niñas": 45, "dolor y gloria": 45, "el buen patron": 45, "buen patron": 45, "as bestas": 45, "hable con ella": 45, "ay carmela": 45, "solas": 45, "la isla minima": 45, "campeonex": 45, "a tres metros sobre el cielo": 45, "tengo ganas de ti": 45, "palmeras en la nieve": 45, "el niño": 45, "el cuerpo": 45, "contratiempo": 45, "padre no hay mas que uno 2": 45, "padre no hay mas que uno 3": 45, "padre no hay mas que uno 4": 45, "alatriste": 45, "el bola": 45, "te doy mis ojos": 45, "la vida secreta de las palabras": 45, "la soledad": 45, "camino": 45, "no habra paz para los malvados": 45, "blancanieves": 45, "truman": 45, "tarde para la ira": 45, "la libreria": 45,
      "pa negre": 65, "pan negro": 65, "el bosque animado": 65, "el sueño del mono loco": 65, "amantes": 65, "todos a la carcel": 65, "dias contados": 65, "nadie hablara de nosotras cuando hayamos muerto": 65, "la buena estrella": 65, "la niña de tus ojos": 65, "vivir es facil con los ojos cerrados": 65, "cinco lobitos": 65, "20000 especies de abejas": 65, "mientras dure la guerra": 65, "magical girl": 65, "el secreto de sus ojos": 65, "agora": 65, "los ojos de julia": 65, "durante la tormenta": 65, "bajocero": 65, "hogar": 65, "toc toc": 65, "perfectos desconocidos": 65, "perdiendo el norte": 65, "las brujas de zugarramurdi": 65, "balada triste de trompeta": 65, "rec 2": 65, "way down": 65, "torrente 2": 65, "torrente 3": 65, "torrente 4": 65, "azuloscurocasinegro": 65, "kika": 65,
      "el viaje a ninguna parte": 85, "furtivos": 85, "la caza": 85, "cria cuervos": 85, "el crimen de cuenca": 85, "crimen de cuenca": 85, "el espinazo del diablo": 85, "el sur": 85, "tristana": 85, "el pico": 85, "pico": 85, "la tia tula": 85, "tia tula": 85, "la escopeta nacional": 85, "deprisa deprisa": 85, "la colmena": 85, "jamon jamon": 85, "los amantes del circulo polar": 85, "lucia y el sexo": 85, "el crack": 85, "barrio": 85, "la piel que habito": 85,
      "arrebato": 100, "surcos": 100, "la aldea maldita": 100, "aldea maldita": 100, "la cabina": 100, "cabina": 100, "los cronocrimenes": 100, "cronocrimenes": 100, "muerte de un ciclista": 100, "que he hecho yo para merecer esto": 100, "historias de la radio": 100
    }
  },
  {
    id: "gen-007", dailyId: "dia1-07", pack: "general",
    texto: "Fruta o verdura de color verde",
    ejemplo: "salicornia",
    answers: {
      "lechuga": 10, "pepino": 10, "kiwi": 10, "aguacate": 10, "brocoli": 10, "espinacas": 10, "espinaca": 10, "guisantes": 10, "guisante": 10, "calabacin": 10, "judias verdes": 10, "judia verde": 10, "pimiento verde": 10, "manzana verde": 10, "lima": 10, "pera": 10, "uva": 10, "uvas": 10, "melon": 10, "alcachofa": 10, "acelga": 10, "acelgas": 10,
      "aceituna": 25, "aceitunas": 25, "aceituna verde": 25, "pistacho": 25, "pistachos": 25, "perejil": 25, "albahaca": 25, "cilantro": 25, "menta": 25, "hierbabuena": 25, "aloe vera": 25, "tomate verde": 25, "limon verde": 25, "platano verde": 25, "wasabi": 25, "alcaparras": 25, "alcaparra": 25, "pepinillo": 25, "pepinillos": 25, "cebollino": 25, "eneldo": 25, "oregano": 25, "romero": 25, "tomillo": 25, "laurel": 25, "te verde": 25, "pero": 25,
      "col": 45, "repollo": 45, "berza": 45, "apio": 45, "puerro": 45, "puerros": 45, "esparrago": 45, "esparragos": 45, "esparrago verde": 45, "esparragos verdes": 45, "coles de bruselas": 45, "canonigos": 45, "rucula": 45, "endibia": 45, "escarola": 45, "habas": 45, "haba": 45, "habitas": 45, "pimiento de padron": 45, "pimientos de padron": 45, "chirimoya": 45, "pimiento italiano": 45, "vainas": 45, "bimi": 45, "uva verde": 45, "uvas verdes": 45, "pera conferencia": 45, "granny smith": 45, "melon piel de sapo": 45,
      "kale": 65, "col rizada": 65, "pak choi": 65, "edamame": 65, "tirabeques": 65, "tirabeque": 65, "grelos": 65, "nabizas": 65, "borraja": 65, "cardo": 65, "guayaba": 65, "ciruela claudia": 65, "ciruela verde": 65, "romanesco": 65, "chayote": 65, "nopal": 65, "okra": 65, "berros": 65, "berro": 65, "feijoa": 65, "verdolaga": 65, "col china": 65, "judia boby": 65, "judia perona": 65, "espinaca baby": 65, "achicoria": 65, "hinojo": 65, "calabaza verde": 65,
      "diente de leon": 85, "ortiga": 85, "melon amargo": 85, "tomatillo": 85, "tomatillo verde": 85, "colinabo": 85, "guanabana": 85, "carambola verde": 85, "papaya verde": 85, "mango verde": 85, "higo verde": 85, "breva verde": 85, "tatsoi": 85, "mizuna": 85, "choy sum": 85, "quiabo": 85, "quimbombo": 85, "alga nori": 85, "alga wakame": 85, "salvia": 85,
      "salicornia": 100, "esparrago de mar": 100, "lima kaffir": 100, "alholva": 100, "luffa": 100, "chayota": 100, "espirulina": 100, "chlorella": 100, "pepino amargo": 100
    }
  },
  {
    id: "gen-008", dailyId: "dia2-01", pack: "general",
    texto: "Cadena de supermercados o hipermercados que opere o haya operado en España",
    ejemplo: "valvi",
    answers: {
      "mercadona": 10, "carrefour": 10, "lidl": 10, "dia": 10, "alcampo": 10, "eroski": 10, "aldi": 10, "el corte ingles": 10, "corte ingles": 10, "hipercor": 10, "consum": 10, "caprabo": 10, "supercor": 10, "carrefour market": 10, "carrefour express": 10, "dia market": 10, "dia maxi": 10, "la plaza de dia": 10,
      "amazon fresh": 25, "amazon": 25, "costco": 25, "walmart": 25, "tesco": 25, "ikea": 25, "leroy merlin": 25, "hacendado": 25, "bazar chino": 25, "ultramarinos": 25, "kiwoko": 25, "primark": 25, "decathlon": 25, "media markt": 25, "mediamarkt": 25, "shein": 25, "temu": 25, "aliexpress": 25, "zara": 25, "tiger": 25, "flying tiger": 25, "fnac": 25, "todo a cien": 25,
      "bonpreu": 45, "esclat": 45, "bonarea": 45, "condis": 45, "ahorramas": 45, "gadis": 45, "masymas": 45, "coviran": 45, "family cash": 45, "froiz": 45, "supersol": 45, "simply": 45, "simply market": 45, "auchan": 45, "champion": 45, "pryca": 45, "continente": 45, "dialprix": 45, "eroski city": 45, "makro": 45, "spar": 45, "eurospar": 45, "interspar": 45, "despar": 45, "supeco": 45, "cash fresh": 45, "hiper planet": 45, "e leclerc": 45, "leclerc": 45, "hiperber": 45, "la sirena": 45, "bofrost": 45,
      "bm": 65, "bm supermercados": 65, "alimerka": 65, "lupa": 65, "hiperdino": 65, "superdino": 65, "dinosol": 65, "cash lepe": 65, "plusfresc": 65, "sorli": 65, "sorli discau": 65, "hiper usera": 65, "el arbol": 65, "maxcoop": 65, "coaliment": 65, "udaco": 65, "gama": 65, "claudio": 65, "aqui e agora": 65, "spar express": 65, "miquel alimentacio": 65, "gmcash": 65, "gros mercat": 65, "comerco": 65, "cash diplo": 65, "cuevas": 65, "plenosol": 65, "congelados 5 oceanos": 65, "cinco oceanos": 65, "tu trebol": 65, "sabeco": 65, "simago": 65, "docks": 65, "promodes": 65, "primaprix": 65, "prima prix": 65,
      "supermercados unide": 85, "unide": 85, "unide market": 85, "aprop": 85, "galerias preciados": 85, "sepu": 85, "cepsa carrefour": 85, "repsol on the run": 85, "disa shop": 85, "spar kanarias": 85, "granbi": 85, "cencosu": 85, "spar gran canaria": 85, "spar tenerife": 85, "vips mart": 85, "opencor": 85, "7 eleven": 85, "seven eleven": 85, "novavenda": 85, "jespac": 85, "deza": 85, "deza calidad": 85, "alsara": 85, "supermercados el jamon": 85, "el jamon": 85, "supermercados dani": 85, "dani": 85,
      "valvi": 100, "gigante": 100, "super sol": 100, "maxi dia": 100, "ultramarinos cano": 100, "supermercados marcial": 100, "marcial": 100, "cordobes": 100, "aramburu": 100, "hiper manacor": 100, "agrupcash": 100, "unagras": 100, "super alcazar": 100
    }
  },
  {
    id: "gen-009", dailyId: "dia2-02", pack: "general",
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
    id: "gen-010", dailyId: "dia2-03", pack: "general",
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
    id: "gen-011", dailyId: "dia2-04", pack: "general",
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
    id: "gen-012", dailyId: "dia2-05", pack: "general",
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
    id: "gen-013", dailyId: "dia2-06", pack: "general",
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
    id: "gen-014", dailyId: "dia2-07", pack: "general",
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
    id: "gen-015", dailyId: "dia3-01", pack: "general",
    texto: "Plato, ración o tapa típica de la gastronomía española",
    ejemplo: "cap i pota",
    answers: {
      "tortilla de patatas": 10, "tortilla española": 10, "tortilla": 10, "paella": 10, "paella valenciana": 10, "croquetas": 10, "croquetas de jamon": 10, "jamon": 10, "jamon iberico": 10, "jamon serrano": 10, "gazpacho": 10, "salmorejo": 10, "patatas bravas": 10, "bravas": 10, "cocido": 10, "cocido madrileño": 10, "calamares": 10, "calamares a la romana": 10, "ensaladilla rusa": 10, "ensaladilla": 10, "pulpo a la gallega": 10, "fabada": 10, "fabada asturiana": 10, "pimientos de padron": 10, "albondigas": 10, "huevos rotos": 10, "gambas al ajillo": 10, "pan con tomate": 10, "alioli": 10, "patatas alioli": 10, "queso": 10, "pincho": 10, "montadito": 10, "boquerones": 10, "gambas": 10, "pulpo": 10, "patatas fritas": 10, "pincho de tortilla": 10, "tapa": 10, "aceitunas": 10,
      "sangria": 25, "churros": 25, "churros con chocolate": 25, "tapas": 25, "pinchos": 25, "pintxos": 25, "bocadillo de calamares": 25, "bocadillo de jamon": 25, "tabla de ibericos": 25, "queso manchego": 25, "jamon de bellota": 25, "paella de marisco": 25, "paella mixta": 25, "arroz con leche": 25, "crema catalana": 25, "tarta de santiago": 25, "pincho moruno": 25, "empanadillas": 25, "chorizo": 25, "papas alioli": 25, "caña": 25, "pinchito": 25, "montaito": 25, "bocata": 25, "chocos": 25, "choco": 25, "boquerones fritos": 25, "gambas a la plancha": 25, "langostinos": 25, "huevos estrellados": 25, "racion": 25, "media racion": 25, "olivas": 25, "sepia": 25, "sepia a la plancha": 25, "almejas": 25, "mejillones": 25, "sardinas": 25, "anchoas": 25, "boqueron": 25, "ensalada mixta": 25,
      "pisto": 45, "boquerones en vinagre": 45, "empanada gallega": 45, "fideua": 45, "arroz negro": 45, "arroz a banda": 45, "lentejas": 45, "potaje": 45, "puchero": 45, "pucheros": 45, "callos": 45, "rabo de toro": 45, "cochinillo asado": 45, "lechazo": 45, "chipirones": 45, "bacalao al pil pil": 45, "bacalao a la vizcaina": 45, "merluza a la vasca": 45, "merluza en salsa verde": 45, "caldo gallego": 45, "lacon con grelos": 45, "escalivada": 45, "calcots": 45, "pimientos rellenos": 45, "berenjenas con miel": 45, "huevos a la flamenca": 45, "migas": 45, "ajoblanco": 45, "gilda": 45, "rabas": 45, "torreznos": 45, "cachopo": 45, "serranito": 45, "flamenquin": 45, "pescaito frito": 45, "espinacas con garbanzos": 45, "pulpo a feira": 45, "pepito": 45, "pepito de ternera": 45, "camperos": 45, "campero": 45, "lagrimitas": 45, "lagrimitas de pollo": 45, "puntillitas": 45, "adobo": 45, "cazon": 45, "cazon en adobo": 45, "oreja": 45, "morro": 45, "morros": 45, "chicharrones": 45, "papas aliña": 45, "papas aliñas": 45, "gachas": 45, "pringa": 45, "montadito de pringa": 45, "altramuces": 45, "choquitos": 45, "navajas": 45, "zamburiñas": 45, "almejas a la marinera": 45, "mejillones al vapor": 45, "gambon": 45, "cigalas": 45, "percebes": 45, "espeto": 45, "espeto de sardinas": 45,
      "marmitako": 65, "zarajos": 65, "atascaburras": 65, "carcamusas": 65, "duelo y quebrantos": 65, "lamprea": 65, "paparajotes": 65, "txangurro": 65, "kokotxas": 65, "alubias de tolosa": 65, "pochas": 65, "chuleton": 65, "oreja a la plancha": 65, "sobrasada": 65, "suquet de peix": 65, "arroz al horno": 65, "caracoles a la llauna": 65, "tumbet": 65, "sopa mallorquina": 65, "gurullos": 65, "papas arrugadas": 65, "mojo picon": 65, "puchero canario": 65, "ropa vieja": 65, "pestiños": 65, "judiones de la granja": 65, "bonito en escabeche": 65, "tortillitas de camarones": 65, "carrilleras": 65, "criadillas": 65, "cocido maragato": 65, "fabes con almejas": 65, "gazpachuelo": 65, "bienmesabe": 65, "tigres": 65, "mejillones tigre": 65, "chanquetes": 65, "acedias": 65, "matrimonio": 65,
      "sorropotun": 85, "morteruelo": 85, "ajoarriero": 85, "bacalao al ajoarriero": 85, "zorongollo": 85, "lomo de orza": 85, "pote asturiano": 85, "porrusalda": 85, "zurrukutuna": 85, "michirones": 85, "caldero murciano": 85, "frite extremeño": 85, "cojonudo": 85, "remojon granadino": 85, "pipirrana": 85, "andrajos": 85, "entresijos": 85,
      "cap i pota": 100, "carne fiesta": 100, "coca de trampo": 100, "frit mallorqui": 100, "arros brut": 100, "faves a la catalana": 100, "samfaina": 100, "potaje de berros": 100, "escaldon de gofio": 100, "ortiguillas": 100, "ajo cabañil": 100, "sangrecilla": 100, "pelotas de fraile": 100, "olla podrida": 100, "trinxat": 100, "xatonada": 100, "chanfaina": 100
    }
  },
  {
    id: "gen-016", dailyId: "dia3-02", pack: "general",
    texto: "Cadena de comida rápida o franquicia de restauración que opere en España",
    ejemplo: "burger ranch",
    answers: {
      "mcdonalds": 10, "mcdonald s": 10, "mc donalds": 10, "mcdonald": 10, "burger king": 10, "bk": 10, "kfc": 10, "telepizza": 10, "dominos": 10, "domino s": 10, "dominos pizza": 10, "pizza hut": 10, "subway": 10, "starbucks": 10, "100 montaditos": 10, "cien montaditos": 10, "foster hollywood": 10, "fosters hollywood": 10, "vips": 10, "taco bell": 10, "five guys": 10, "pans and company": 10, "pans company": 10, "burguer": 10, "montaditos": 10, "foster": 10, "fosters": 10, "mcdonals": 10, "macdonals": 10, "macdonalds": 10, "burguer king": 10, "burgerking": 10, "domino": 10,
      "chilis": 25, "chili s": 25, "hooters": 25, "ruby tuesday": 25, "starbucks coffee": 25, "restaurante vips": 25, "burger": 25, "hamburgueseria": 25, "pizzeria": 25, "kebab": 25, "dunkin": 25, "dunkin donuts": 25, "krispy kreme": 25, "tim hortons": 25, "wendys": 25, "wendy s": 25, "popeyes": 25, "costa coffee": 25, "hard rock cafe": 25, "planet hollywood": 25, "dennys": 25, "denny s": 25, "tgi fridays": 25, "fridays": 25, "papa johns": 25, "papa john s": 25, "little caesars": 25, "pret a manger": 25, "macas": 25, "el macas": 25, "mcauto": 25, "kentucky": 25, "el kentucky": 25, "telepi": 25, "el telepi": 25, "100m": 25, "sureña": 25, "pans": 25, "kebap": 25, "el kebab": 25, "chino": 25, "restaurante chino": 25, "wok": 25, "buffet": 25, "bufe": 25, "buffet libre": 25, "manolo bakes": 25, "manolitos": 25, "llaollao": 25, "mc": 25, "el mc": 25, "telepiza": 25, "taco": 25, "popeye": 25, "el popeyes": 25, "fiveguys": 25, "dunkin donut": 25, "starbuck": 25, "100 montaitos": 25, "cien montaitos": 25, "montaitos": 25, "papa john": 25, "kfc pollo": 25, "japones": 25, "sushi": 25, "turco": 25,
      "foster s hollywood": 45, "vips smart": 45, "dunkin coffee": 45, "cafe y te": 45, "cinco jotas": 45, "tea shop": 45, "llao llao": 45, "goiko": 45, "goiko grill": 45, "rodilla": 45, "tgb": 45, "the good burger": 45, "bacoa": 45, "vicio": 45, "fitzgerald": 45, "pomodoro": 45, "ginos": 45, "gino s": 45, "tagliatelle": 45, "la tagliatella": 45, "tagliatella": 45, "bocatta": 45, "lizarran": 45, "wok to walk": 45, "viena": 45, "honest greens": 45, "flax and kale": 45, "kentucky fried chicken": 45, "santa gloria": 45, "santagloria": 45, "smooy": 45, "tgb burger": 45, "carls junior": 45, "carl jr": 45, "tim horton": 45, "little caesar": 45, "running sushi": 45,
      "tommy mel s": 65, "tony roma s": 65, "carl s jr": 65, "txapela": 65, "muerde la pasta": 65, "wagamama": 65, "vapiano": 65, "viena capellanes": 65, "ribs": 65, "la pepita burger bar": 65, "hamburguesa nostra": 65, "nostrum": 65, "la mafia se sienta a la mesa": 65, "la mafia": 65, "sbarro": 65, "tommy mels": 65, "tony romas": 65, "carls jr": 65, "fresc co": 65, "lateral": 65, "la vaca argentina": 65, "fast good": 65, "pomme de pain": 65, "paul": 65, "cafe and te": 65, "sushi shop": 65, "cerveceria 100 montaditos": 65, "cañas y tapas": 65, "pollo feliz": 65, "pollo loco": 65, "kaiten sushi": 65,
      "smoy": 85, "il padrino": 85, "museo del jamon": 85, "pizza movil": 85, "cantina mariachi": 85, "ten con ten": 85, "il tavolo verde": 85, "alsur cafe": 85, "home burger bar": 85, "eat out": 85, "pollo campero": 85, "wimpy": 85, "sagardi": 85,
      "jamaica coffee shop": 100, "panaria": 100, "granier": 100, "panod": 100, "la mallorquina": 100, "sushita cafe": 100, "cruz blanca": 100, "mama campo": 100, "taberna del volapie": 100, "volapie": 100, "cafe de indias": 100, "pastelerias mallorca": 100, "burger ranch": 100
    }
  },
  {
    id: "gen-017", dailyId: "dia3-03", pack: "general",
    texto: "Serie de televisión española (clásica o actual)",
    ejemplo: "la bola de cristal",
    answers: {
      "aqui no hay quien viva": 10, "anhqv": 10, "la que se avecina": 10, "lqsa": 10, "los serrano": 10, "cuentame": 10, "cuentame como paso": 10, "el internado": 10, "fisica o quimica": 10, "la casa de papel": 10, "aida": 10, "7 vidas": 10, "siete vidas": 10, "verano azul": 10, "medico de familia": 10, "hospital central": 10, "los hombres de paco": 10, "el barco": 10, "vis a vis": 10, "elite": 10,
      "money heist": 25, "berlin": 25, "el ministerio del tiempo": 25, "manos a la obra": 25, "antidisturbios": 25, "patria": 25, "farina": 25, "machos alfa": 25, "las chicas del cable": 25, "velvet": 25, "gran hotel": 25, "amar es para siempre": 25, "el principe": 25, "la reina del sur": 25, "el embarcadero": 25, "vivir sin permiso": 25, "la peste": 25, "la unidad": 25, "paquita salas": 25, "merli": 25, "los misterios de laura": 25, "hierro": 25,
      "amar en tiempos revueltos": 45, "tiempos de guerra": 45, "bandolera": 45, "carlos rey emperador": 45, "la otra mirada": 45, "la cocinera de castamar": 45, "la templanza": 45, "alta mar": 45, "el cid": 45, "escenas de matrimonio": 45, "lleno por favor": 45, "vecinos": 45, "hermanos de leche": 45, "malviviendo": 45, "crematorio": 45, "comisario": 45, "el comisario": 45, "policias en el corazon de la calle": 45, "periodistas": 45, "compañeros": 45, "al salir de clase": 45, "los pazos de ulloa": 45, "el super": 45, "la pecera de eva": 45, "mis adorables vecinos": 45, "ana y los siete": 45, "el pantano": 45, "motivos personales": 45, "los protegidos": 45, "la riera": 45, "el secreto de puente viejo": 45, "puente viejo": 45, "gran reserva": 45, "acacias 38": 45, "el accidente": 45, "mar de plastico": 45, "bajo sospecha": 45, "yo soy bea": 45, "hispania la leyenda": 45, "hispania": 45, "isabel": 45, "el tiempo entre costuras": 45, "la catedral del mar": 45, "la huella del crimen": 45, "farmacia de guardia": 45, "la mesias": 45,
      "paraiso": 65, "la zona": 65, "vota juan": 65, "veneno": 65, "madres amor y vida": 65, "la fortuna": 65, "toy boy": 65, "el desorden que dejas": 65, "jaguar": 65, "sin identidad": 65, "la caza monteperdido": 65, "la caza tramuntana": 65, "el don de alba": 65, "el inquilino": 65, "la casa de los lios": 65, "ay señor señor": 65, "la señora": 65, "el pueblo": 65, "estoy vivo": 65, "las aventuras del capitan alatriste": 65, "mercado central": 65, "querido maestro": 65, "chiringuito de pepe": 65, "el chiringuito de pepe": 65, "lazos de sangre": 65,
      "ellas y el sexo debil": 85, "gominolas": 85, "el jefe": 85, "los herederos": 85, "alma": 85, "los jinetes del alba": 85, "la regenta": 85, "fortunata y jacinta": 85, "los gozos y las sombras": 85, "cañas y barro": 85, "luna negra": 85, "fuera de lugar": 85, "pepa y pepe": 85, "la mansion de los plaza": 85, "visto y no visto": 85, "teresa de jesus": 85,
      "la forja de un rebelde": 100, "hermanos y detectives": 100, "makinavaja": 100, "los ladrones van a la oficina": 100, "curro jimenez": 100, "ramon y cajal": 100, "anillos de oro": 100, "turno de oficio": 100, "juncal": 100, "brigada central": 100, "gym tony": 100, "la bola de cristal": 100
    }
  },
  {
    id: "gen-018", dailyId: "dia3-04", pack: "general",
    texto: "Objeto, herramienta o accesorio que se suele guardar en la guantera o maletero del coche",
    ejemplo: "cortacinturones",
    answers: {
      "chaleco": 10, "chaleco reflectante": 10, "chaleco reflectante homologado": 10, "triangulos": 10, "triangulo": 10, "rueda de repuesto": 10, "rueda de recambio": 10, "gato": 10, "papeles": 10, "documentacion": 10, "seguro": 10, "baliza v16": 10, "v16": 10, "baliza": 10, "linterna": 10, "extintor": 10, "botiquin": 10, "pinzas de bateria": 10, "cables de arranque": 10, "llave de cruz": 10, "herramientas": 10, "rueda": 10, "luz de emergencia": 10, "pinzas": 10,
      "maleta": 25, "maletas": 25, "equipaje": 25, "paraguas": 25, "mochila": 25, "bolsa": 25, "cinta americana": 25, "bridas": 25, "guantes": 25, "trapo": 25, "gafas de sol": 25, "gps": 25, "navegador": 25, "movil": 25, "cargador": 25, "cargador de movil": 25, "botella de agua": 25, "agua": 25, "manta": 25, "mantas": 25, "ambientador": 25, "peluche": 25, "ruedas de nieve": 25, "monedas": 25, "suelto": 25, "bolsas del mercadona": 25, "bolsas": 25, "bolsas de la compra": 25, "chaqueta": 25, "sudadera": 25, "kleenex": 25, "pañuelos": 25, "toallitas": 25, "cable": 25, "cable del movil": 25, "soporte del movil": 25, "soporte": 25, "llaves": 25, "mando del garaje": 25, "mando": 25, "ticket del parking": 25, "ticket": 25, "itv": 25, "pegatina": 25, "pegatina de la itv": 25, "luz": 25, "bayeta": 25, "silla del niño": 25, "sillita": 25, "silla de bebe": 25, "perro": 25, "chicles": 25, "caramelos": 25, "tabaco": 25, "vaper": 25, "monedero": 25, "cartera": 25, "bluetooth": 25, "usb": 25, "pendrive": 25, "parte amistoso": 25,
      "parasol": 45, "rascador de hielo": 45, "cadenas de nieve": 45, "cadenas": 45, "kit de pinchazos": 45, "spray antipinchazos": 45, "fusibles": 45, "bombillas": 45, "bombillas de repuesto": 45, "anticongelante": 45, "aceite": 45, "liquido de frenos": 45, "liquido limpiaparabrisas": 45, "compresor": 45, "inflador": 45, "bomba de aire": 45, "manometro": 45, "eslinga": 45, "cuerda de remolque": 45, "cable de remolque": 45, "barra de remolque": 45, "destornillador": 45, "destornilladores": 45, "alicates": 45, "martillo": 45, "cinta aislante": 45, "bidon de gasolina": 45, "bidon": 45, "garrafa": 45, "embudo": 45, "limpiaparabrisas": 45, "escobillas": 45, "llave inglesa": 45, "juego de llaves": 45, "llave de rueda": 45, "linterna frontal": 45, "carro de la compra": 45, "pino": 45, "pino de olor": 45, "muñeco": 45, "virgen": 45, "estampita": 45, "rosario": 45, "llaves de repuesto": 45, "multa": 45, "pegatina ambiental": 45, "rascador": 45, "aspirador": 45, "transportin": 45, "correa del perro": 45, "cenicero": 45, "tarjetero": 45, "camara": 45, "cds": 45,
      "llave dinamometrica": 65, "obd": 65, "escaner obd": 65, "bateria externa": 65, "arrancador de bateria": 65, "arrancador": 65, "cinchas": 65, "cinchas de carga": 65, "pala plegable": 65, "pala": 65, "alfombrillas": 65, "lona": 65, "manta termica": 65, "mantas termicas": 65, "silbato": 65, "bengalas": 65, "bengala": 65, "mechero": 65, "cerillas": 65, "cuña": 65, "calzos": 65, "cuñas": 65, "carraca": 65, "llave de vaso": 65, "llaves allen": 65, "lampara de inspeccion": 65, "frontal": 65, "luz estroboscopica": 65, "martillo rompecristales": 65, "martillo de emergencia": 65, "valvulina": 65, "pulverizador": 65, "wd 40": 65, "wd40": 65, "lubricante": 65, "elvis": 65, "perrito que mueve la cabeza": 65, "san cristobal": 65, "comederos": 65, "via t": 65, "telepeaje": 65, "dashcam": 65, "transmisor fm": 65, "cintas": 65, "cassette": 65, "fary": 65, "camela": 65,
      "multimetro": 85, "tester": 85, "tester de bateria": 85, "extractor": 85, "mordaza": 85, "tablas de traccion": 85, "tablas de arena": 85, "gato hidraulico": 85, "gato de tijera": 85, "gato de botella": 85, "caballete": 85, "caballetes": 85, "alicates de presion": 85, "polimetro": 85, "llave de pipa": 85, "sirga": 85, "gancho de remolque": 85, "ojal de remolque": 85, "cierre de rueda antirrobo": 85, "tuerca antirrobo": 85,
      "cortacinturones": 100, "cortacinturon": 100, "cizalla": 100, "extractor de pernos": 100, "bomba de vacio": 100, "kit de distribucion": 100, "calibre": 100, "pie de rey": 100, "calibrador": 100, "galga": 100, "galgas": 100, "bomba de achique": 100
    }
  },
  {
    id: "gen-019", dailyId: "dia3-05", pack: "general",
    texto: "Dulce, bollería industrial, galleta o snack de quiosco vendido en España",
    ejemplo: "gusiluz",
    easterEgg: "mantecado",
    answers: {
      "donuts": 10, "donut": 10, "bollycao": 10, "phoskitos": 10, "pantera rosa": 10, "tigreton": 10, "bony": 10, "filipinos": 10, "conguitos": 10, "oreo": 10, "principe": 10, "maria": 10, "galletas maria": 10, "cheetos": 10, "lays": 10, "doritos": 10, "pringles": 10, "ruffles": 10, "kinder bueno": 10, "kit kat": 10, "risketos": 10, "gusanitos": 10, "chupa chups": 10, "chicles": 10, "lacasitos": 10, "kinder sorpresa": 10, "palmera de chocolate": 10, "tocino de cielo": 10, "palotes": 10, "llaves acidas": 10, "chetos": 10, "chicle": 10, "piruleta": 10, "palote": 10, "kitkat": 10, "huevo kinder": 10, "bollicao": 10, "riskettos": 10, "chupa chup": 10,
      "chocolate": 25, "galletas": 25, "patatas fritas": 25, "patatas": 25, "snickers": 25, "mars": 25, "twix": 25, "bounty": 25, "kinder": 25, "ferrero rocher": 25, "magdalenas": 25, "croissant": 25, "napolitana": 25, "palmera": 25, "ensaimada": 25, "gominolas": 25, "chuches": 25, "caramelos": 25, "palomitas": 25, "pipas": 25, "frutos secos": 25, "cacahuetes": 25, "maiz": 25, "panchitos": 25, "gomitas": 25, "esponjitas": 25, "orbit": 25, "m ms": 25, "mms": 25, "emanems": 25, "nutella": 25, "nocilla": 25, "caña": 25, "caña de chocolate": 25, "cruasan": 25, "curasan": 25, "magdalena": 25, "pipas peladas": 25, "pipas con sal": 25, "cheetos pandilla": 25, "ruffles jamon": 25, "campesinas": 25, "lays campesinas": 25, "palomitas de mantequilla": 25, "smint": 25,
      "huesitos": 45, "campurrianas": 45, "tosta rica": 45, "chiquilin": 45, "napolitanas": 45, "mantecado": 45, "mantecados": 45, "pelotazos": 45, "gublins": 45, "jumpers": 45, "boca bits": 45, "takis": 45, "mikado": 45, "tokke": 45, "fiesta": 45, "kojak": 45, "fresquito": 45, "donettes": 45, "tigretones": 45, "pinguinos": 45, "ganchitos": 45, "kikos": 45, "pipas tijuana": 45, "pipas facundo": 45, "dinosaurus": 45, "chips ahoy": 45, "digestive": 45, "galletas digestive": 45, "cuetara": 45, "artiach": 45, "gullon": 45, "fontaneda": 45, "milka": 45, "toblerone": 45, "raffaello": 45, "kinder delice": 45, "kinder maxi": 45, "kinder pingui": 45, "kinder joy": 45, "sugus": 45, "peta zetas": 45, "regaliz": 45, "haribo": 45, "mentos": 45, "trident": 45, "bazooka": 45, "ladrillos": 45, "lenguas": 45, "petazetas": 45, "pipas el piponazo": 45, "piponazo": 45, "pipas aguasal": 45, "aspitos": 45, "pandilla": 45, "fantasmitas": 45, "pajitas": 45, "conos": 45, "3d": 45, "bugles": 45, "vinagreta": 45, "lays al punto de sal": 45, "fritos": 45, "fritos matutano": 45, "bits": 45, "bocabits": 45, "pajitas de patata": 45, "torreznos de bolsa": 45, "corteza": 45, "cacahuetes con miel": 45, "kikos gigantes": 45, "mister corn": 45, "mr corn": 45, "palomitas ketchup": 45, "fresquitos": 45, "dipper": 45, "dipper xl": 45, "pintalenguas": 45, "melones": 45, "chicles melones": 45, "chicles boomer": 45, "happydent": 45, "five": 45,
      "bimbo": 65, "panrico": 65, "pepitos": 65, "birba": 65, "lotus": 65, "biscoff": 65, "galletas lotus": 65, "oreo thins": 65, "quicos": 65, "cortezas": 65, "chicharrones": 65, "maiz frito": 65, "monster munch": 65, "nachos": 65, "tortilla chips": 65, "snack de queso": 65, "bollo suizo": 65, "caracola": 65, "sobao": 65, "sobaos pasiegos": 65, "barquillo": 65, "barquillos": 65, "oblea": 65, "obleas": 65, "gofre": 65, "gofres": 65, "tronky": 65, "juanola": 65, "pastilla juanola": 65, "fruittella": 65, "pictolin": 65, "ositos de goma": 65, "nubes": 65, "algodon de azucar": 65, "boomer": 65, "milky way": 65, "munchitos": 65, "clix": 65,
      "dulcesol": 85, "marbu": 85, "cubanitos": 85, "cheiw": 85, "churruca": 85, "risi": 85, "matutano": 85, "pipas g": 85, "dentyne": 85, "pica pica": 85, "galletas sultana": 85, "palotes de regaliz": 85,
      "gusiluz": 100, "trolli": 100, "pez": 100, "garrapiñadas": 100, "almendras garrapiñadas": 100, "cacahuetes garrapiñados": 100, "polvos pica pica": 100, "barquillo de nata": 100
    }
  },
  {
    id: "gen-020", dailyId: "dia3-06", pack: "general",
    texto: "Marca de ropa, calzado o equipamiento deportivo",
    ejemplo: "luanvi",
    answers: {
      "zara": 10, "nike": 10, "adidas": 10, "pull and bear": 10, "pull bear": 10, "bershka": 10, "stradivarius": 10, "mango": 10, "h and m": 10, "hm": 10, "puma": 10, "decathlon": 10, "quechua": 10, "reebok": 10, "levis": 10, "lacoste": 10, "converse": 10, "vans": 10, "new balance": 10, "primark": 10, "shein": 10, "inditex": 10, "massimo dutti": 10, "oysho": 10,
      "gucci": 25, "prada": 25, "louis vuitton": 25, "chanel": 25, "dior": 25, "versace": 25, "armani": 25, "ralph lauren": 25, "tommy hilfiger": 25, "calvin klein": 25, "supreme": 25, "off white": 25, "balenciaga": 25, "burberry": 25, "hermes": 25, "moncler": 25, "the north face": 25, "north face": 25, "patagonia": 25, "columbia": 25, "timberland": 25, "dr martens": 25, "crocs": 25, "birkenstock": 25,
      "joma": 45, "kelme": 45, "munich": 45, "paredes": 45, "yumas": 45, "victoria": 45, "pompeii": 45, "scalpers": 45, "el ganso": 45, "spagnolo": 45, "silbon": 45, "desigual": 45, "bimba y lola": 45, "loewe": 45, "salomon": 45, "mizuno": 45, "asics": 45, "under armour": 45, "umbro": 45, "kappa": 45, "hummel": 45, "meyba": 45, "ellesse": 45, "champion": 45, "diadora": 45, "lotto": 45, "fila": 45, "skechers": 45, "camper": 45, "pikolinos": 45, "springfield": 45, "cortefiel": 45, "women secret": 45, "sfera": 45, "lefties": 45, "pepe jeans": 45, "tous": 45,
      "callaghan": 65, "panama jack": 65, "chiruca": 65, "hanwag": 65, "boreal": 65, "ternua": 65, "bestard": 65, "la sportiva": 65, "salewa": 65, "berghaus": 65, "mammut": 65, "jack wolfskin": 65, "fjallraven": 65, "marmot": 65, "trangoworld": 65, "astore": 65, "altus": 65, "tintoretto": 65, "pedro del hierro": 65, "adolfo dominguez": 65, "purificacion garcia": 65, "custo barcelona": 65, "sita murt": 65, "lois": 65, "quiksilver": 65, "billabong": 65, "roxy": 65, "rip curl": 65, "volcom": 65,
      "rossignol": 85, "oakley": 85, "odlo": 85, "bullpadel": 85, "nox": 85, "siux": 85, "star vie": 85, "vibor a": 85, "black crown": 85, "babolat": 85, "gioseppo": 85, "hispanitas": 85, "castañer": 85, "pretty ballerinas": 85, "martinelli": 85, "chie mihara": 85, "fluchos": 85, "coolway": 85, "mustang": 85,
      "luanvi": 100, "sappa": 100, "errea": 100, "macron": 100, "givova": 100, "uhlsport": 100, "mitre": 100, "patrick": 100, "pony": 100, "j hayber": 100, "hi tec": 100, "rasan": 100, "arc teryx": 100, "ortovox": 100, "maloja": 100
    }
  },
  {
    id: "gen-021", dailyId: "dia3-07", pack: "general",
    texto: "Profesión, oficio tradicional o puesto de trabajo",
    ejemplo: "campanero",
    answers: {
      "medico": 10, "doctor": 10, "profesor": 10, "maestro": 10, "policia": 10, "bombero": 10, "abogado": 10, "ingeniero": 10, "camarero": 10, "albañil": 10, "fontanero": 10, "electricista": 10, "enfermero": 10, "enfermera": 10, "arquitecto": 10, "panadero": 10, "carpintero": 10, "peluquero": 10, "cocinero": 10, "conductor": 10, "taxista": 10, "dentista": 10, "periodista": 10, "jardinero": 10,
      "presidente": 25, "rey": 25, "astronauta": 25, "youtuber": 25, "influencer": 25, "futbolista": 25, "actor": 25, "cantante": 25, "modelo": 25, "escritor": 25, "pintor": 25, "detective": 25, "espia": 25, "pirata": 25, "vaquero": 25, "soldado": 25, "ladron": 25, "mago": 25, "payaso": 25, "emprendedor": 25, "community manager": 25, "apicultor": 25, "poli": 25, "profe": 25, "fisio": 25, "psiquiatra": 25, "juez": 25, "fiscal": 25, "cura": 25, "monja": 25, "militar": 25, "camionero": 25, "uber": 25, "cabify": 25, "rider": 25, "glovo": 25, "amazon": 25, "limpiadora": 25, "canguro": 25, "niñera": 25, "chef": 25, "frutero": 25, "dj": 25, "streamer": 25, "tiktoker": 25, "gamer": 25, "entrenador": 25, "arbitro": 25, "obrero": 25, "barbero": 25, "tatuador": 25, "informatico": 25, "programador": 25, "hacker": 25, "banquero": 25, "jefe": 25, "autonomo": 25, "funcionario": 25, "politico": 25, "alcalde": 25, "jubilado": 25, "parado": 25, "nini": 25, "estudiante": 25, "becario": 25, "jefa": 25, "encargado": 25, "encargada": 25, "director": 25, "ceo": 25, "comercial": 25, "vendedor": 25, "azafata": 25, "piloto": 25,
      "chapista": 45, "mecanico": 45, "soldador": 45, "cerrajero": 45, "vidriero": 45, "tapicero": 45, "zapatero": 45, "sastre": 45, "costurera": 45, "carnicero": 45, "pescadero": 45, "barrendero": 45, "basurero": 45, "cartero": 45, "contable": 45, "administrativo": 45, "secretario": 45, "recepcionista": 45, "dependiente": 45, "cajero": 45, "reponedor": 45, "repartidor": 45, "mensajero": 45, "vigilante": 45, "guardia civil": 45, "portero": 45, "conserje": 45, "limpiador": 45, "fisioterapeuta": 45, "psicologo": 45, "veterinario": 45, "celador": 45, "matrona": 45, "optico": 45, "farmaceutico": 45, "agricultor": 45, "pescador": 45, "ganadero": 45, "pastor": 45, "minero": 45, "madero": 45, "civil": 45, "municipal": 45, "local": 45, "muni": 45, "barman": 45, "segurata": 45, "chispas": 45, "paleta": 45, "peon": 45, "esteticien": 45, "currito": 45, "currante": 45, "gerente": 45, "teleoperador": 45, "teleoperadora": 45, "azafato": 45,
      "tornero": 65, "fresador": 65, "auditor": 65, "actuario": 65, "notario": 65, "registrador": 65, "herrero": 65, "estibador": 65, "controlador aereo": 65, "perito": 65, "gruista": 65, "encofrador": 65, "ferrallista": 65, "calderero": 65, "forjador": 65, "ajustador": 65, "electromecanico": 65, "lampista": 65, "yesero": 65, "escayolista": 65, "solador": 65, "cantero": 65, "gestor": 65, "agente de seguros": 65, "corredor de bolsa": 65, "chacha": 65,
      "luthier": 85, "tonelero": 85, "afilador": 85, "relojero": 85, "taxidermista": 85, "fraguero": 85, "fraguera": 85, "cestero": 85, "alfarero": 85, "ceramista": 85, "orfebre": 85, "joyero": 85, "platero": 85, "armero": 85, "curtidor": 85, "herrador": 85, "carbonero": 85, "leñador": 85, "arriero": 85, "sombrerero": 85, "organero": 85, "ebanista": 85, "encuadernador": 85,
      "campanero": 100, "boticario": 100, "pregonero": 100, "sereno": 100, "aguador": 100, "amolador": 100, "botero": 100, "calesero": 100, "cordelero": 100, "tejedor": 100, "cardador": 100, "batanero": 100, "dorador": 100, "bruñidor": 100, "litografo": 100, "numismatico": 100, "albeitar": 100
    }
  },
  {
    id: "pal-003", dailyId: "dia7-07", pack: "palabras",
    texto: "Palabra que contenga las cinco vocales (panvocálica)",
    ejemplo: "cuodlibetal",
    answers: {
      "murcielago": 10, "eucalipto": 10, "ayuntamiento": 10, "arquitecto": 10, "educacion": 10, "abuelito": 10, "neumatico": 10, "secundario": 10,
      "murciegalo": 25, "aeiou": 25, "aurelio": 25, "eulalio": 25, "eulogia": 25, "euforia": 25, "euforica": 25, "hipotenusa": 25, "orquidea": 25, "supermario": 25, "adulterio": 25, "cuestionar": 25, "albaricoque": 25, "paquidermo": 25, "supercalifragilisticoespialidoso": 25,
      "aceituno": 45, "reumatico": 45, "inadecuado": 45, "autentico": 45, "equivocado": 45, "precaucion": 45, "regulacion": 45, "centrifugado": 45, "comunicable": 45, "comunicarse": 45, "persuasion": 45, "cuadrilatero": 45, "revolucionaria": 45, "revolucionario": 45, "universitario": 45, "audiovisuales": 45, "pañuelito": 45, "suplementario": 45, "presupuestario": 45, "documentalista": 45, "entusiasmo": 45, "entusiasmado": 45, "estimulador": 45, "estimuladora": 45, "evolucionar": 45, "educativo": 45, "configurable": 45, "cuestionario": 45, "curiosamente": 45, "desilusionar": 45, "funcionamiento": 45, "numeracion": 45, "puntuaciones": 45, "reputacion": 45, "restauracion": 45, "situaciones": 45, "superpoblacion": 45, "voluntariedad": 45, "publicaciones": 45, "recuperacion": 45, "remuneracion": 45, "reunificacion": 45, "subestimado": 45, "sobreactuacion": 45, "consecuencia": 45,
      "reconquistar": 65, "menstruacion": 65, "encuadernacion": 65, "republicano": 65, "consanguineo": 65, "desarticulado": 65, "desarticulacion": 65, "aceitunero": 65, "escupitajo": 65, "aguileño": 65, "acuñamiento": 65, "arquitectonico": 65, "argumentacion": 65, "autenticacion": 65, "autorregulacion": 65, "bautisterio": 65, "cauterizacion": 65, "coeducacion": 65, "consecutiva": 65, "conquistadores": 65, "cuentakilometros": 65, "desahuciado": 65, "desocupacion": 65, "despreocupacion": 65, "documentaria": 65, "ecuatoriano": 65, "especulacion": 65, "estructuracion": 65, "excomulgacion": 65, "farmaceutico": 65, "gesticulacion": 65, "gubernativo": 65, "alucinogeno": 65, "insurreccional": 65, "interurbano": 65, "justipreciado": 65, "lubricaciones": 65, "manipuladores": 65, "pasteurizado": 65, "persecutoria": 65, "autobiograficamente": 65,
      "vituperando": 85, "jaquimero": 85, "guaperio": 85, "sudoriental": 85, "zurrapiento": 85, "enloquecida": 85, "cigueñato": 85, "comunicadero": 85, "pseudoganglio": 85, "arquiepiscopal": 85, "auriculoventricular": 85, "autoindulgencia": 85, "boquiabierto": 85, "circunnavegacion": 85, "consuetudinario": 85, "contrarrevolucion": 85, "cuadragesimo": 85, "desnaturalizado": 85, "electroacustica": 85, "genitourinaria": 85, "hipoglucemia": 85, "incomunicable": 85, "semiconductoras": 85, "neurocirugia": 85, "ultraperiferico": 85, "abrenuncio": 85,
      "estanquillero": 100, "cuodlibetal": 100, "cuakerismo": 100, "cuaquerismo": 100, "cuadriplejico": 100, "neuropsiquiatra": 100, "seudohermafrodita": 100, "arqueobacteriano": 100, "esternoclavicular": 100, "aurifero": 100, "eudiometria": 100, "leucocitaria": 100, "aguijonear": 100, "autoluminiscente": 100, "braquiocefalico": 100,
      "aeronautico": 25, "aeroportuario": 25, "agropecuario": 25, "alfanumerico": 25,
      "adulterino": 25, "acuifero": 25, "albaricoquero": 45, "alberchiguero": 45,
      "altilocuente": 45, "alumbramiento": 45, "aponeurosis": 45, "albuminoide": 65,
      "albuminoideo": 65, "alguacilesco": 65, "alharaquiento": 65
    }
  },
  {
    id: "pal-004", dailyId: "dia7-05", pack: "palabras",
    texto: "Palabra suelta (no frase) que sea un palíndromo en español",
    ejemplo: "rotomotor",
    answers: {
      "oso": 10, "ojo": 10, "ana": 10, "reconocer": 10, "somos": 10, "radar": 10, "salas": 10, "solos": 10,
      "aibofobia": 25, "dabale arroz a la zorra el abad": 25, "anita lava la tina": 25, "amo la paloma": 25, "yo hago yoga hoy": 25, "luz azul": 25, "kayak": 25, "otto": 25, "bob": 25, "ava": 25, "ada": 25, "eve": 25, "hannah": 25, "tenet": 25, "lol": 25, "wow": 25,
      "rotor": 45, "seres": 45, "sedes": 45, "aca": 45, "alla": 45, "oro": 45, "ala": 45, "ama": 45, "ata": 45, "asa": 45, "ara": 45, "aya": 45, "aja": 45, "ese": 45, "eje": 45, "efe": 45, "ele": 45, "eme": 45, "ene": 45, "eñe": 45, "ere": 45, "erre": 45, "elle": 45, "sus": 45, "non": 45, "pop": 45, "gag": 45, "pep": 45, "nadan": 45, "narran": 45, "sanas": 45, "sacas": 45, "sagas": 45, "sosos": 45, "sotos": 45, "rayar": 45, "rajar": 45, "rallar": 45, "rapar": 45, "rasar": 45, "ojo rojo": 45, "oso baboso": 45,
      "anilina": 65, "arenera": 65, "arepera": 65, "anona": 65, "anana": 65, "rodador": 65, "sometemos": 65, "rever": 65, "acurruca": 65, "aviva": 65, "azuza": 65, "aerea": 65, "alela": 65, "alila": 65, "amama": 65, "amima": 65, "apipa": 65, "ateta": 65, "afofa": 65, "sajas": 65, "selles": 65, "sobos": 65, "sexes": 65, "napan": 65, "madam": 65, "oruro": 65, "aza": 65, "apa": 65, "ete": 65, "arra": 65, "nen": 65, "somos o no somos": 65, "alli ves sevilla": 65, "arriba la birra": 65, "la ruta natural": 65, "a ti no bonita": 65, "ella te da detalle": 65,
      "amad a la dama": 85, "se van sus naves": 85, "son robos o sobornos": 85, "atar a la rata": 85, "no traces en ese carton": 85, "isaac no ronca asi": 85, "se verlas al reves": 85, "nada yo soy adan": 85, "adan no calla con nada": 85, "yo dono rosas oro no doy": 85, "amo la pacifica paloma": 85, "ana lleva al oso la avellana": 85, "oi lo de mama me dolio": 85, "sometamos o matemos": 85, "a la torre derrotala": 85, "añora la roña": 85, "amarga la grama": 85, "ata la lata": 85, "alala": 85, "alula": 85, "asesa": 85, "apopa": 85, "afufa": 85, "acoca": 85, "arara": 85,
      "rotomotor": 100, "aña": 100, "uru": 100, "oto": 100, "aga": 100, "sebes": 100, "seles": 100, "senes": 100, "setes": 100, "soros": 100, "sonos": 100, "robor": 100, "rodor": 100, "razar": 100, "malayalam": 100, "atale demoniaco cain o me delata": 100, "salta lenin el atlas": 100, "la ruta nos aporto otro paso natural": 100, "eva usaba rimel y le miraba suave": 100, "alli si maria avisa y asi va a ir a mi silla": 100,
      "dvd": 25, "ses": 45, "sis": 45, "aba": 45,
      "dad": 45, "ovo": 45, "oyo": 45, "datad": 65,
      "dimid": 65, "nomon": 85, "oidio": 85, "nin": 85
    }
  },
  {
    id: "pal-005", dailyId: "dia8-03", pack: "palabras",
    texto: "Palabra que termine en «Z»",
    ejemplo: "desguarnecer",
    answers: {
      "paz": 10, "luz": 10, "voz": 10, "pez": 10, "diez": 10, "arroz": 10, "feliz": 10,
      "raiz": 10, "nariz": 10, "cruz": 10, "juez": 10, "vez": 10, "capaz": 10, "actriz": 10,
      "ajedrez": 10,
      "albornoz": 25, "acidez": 25, "andaluz": 25, "aprendiz": 25, "avestruz": 25, "altavoz": 25, "rapidez": 25,
      "vejez": 25, "niñez": 25, "calidez": 25, "timidez": 25, "validez": 25, "veloz": 25, "voraz": 25,
      "vivaz": 25, "fugaz": 25, "audaz": 25, "precoz": 25, "feroz": 25, "perdiz": 25, "lombriz": 25,
      "matriz": 25, "cicatriz": 25, "barniz": 25, "tapiz": 25, "disfraz": 25, "antifaz": 25, "capataz": 25,
      "nuez": 25, "haz": 25, "faz": 25, "doblez": 25, "escasez": 25, "estupidez": 25, "madurez": 25,
      "palidez": 25, "honradez": 25, "sensatez": 25, "pesadez": 25, "rigidez": 25,
      "altivez": 45, "alcatraz": 45, "atroz": 45, "amarillez": 45, "aridez": 45, "arcabuz": 45, "soez": 45,
      "sagaz": 45, "tenaz": 45, "falaz": 45, "mordaz": 45, "locuaz": 45, "veraz": 45, "tez": 45,
      "trasluz": 45, "tragaluz": 45, "variz": 45, "solidez": 45, "estrechez": 45, "tirantez": 45, "flacidez": 45,
      "lucidez": 45, "mudez": 45, "sordidez": 45, "agraz": 45, "caliz": 45, "chintz": 45, "almez": 45,
      "matraz": 45, "motriz": 45, "nutriz": 45, "cerviz": 45, "tamiz": 45, "testuz": 45, "tragaz": 45,
      "torcaz": 45, "desliz": 45,
      "ajimez": 65, "almirez": 65, "altramuz": 65, "alefriz": 65, "alfaraz": 65, "alferraz": 65, "alficoz": 65,
      "alfiz": 65, "alfoz": 65, "algidez": 65, "tondiz": 65, "tornavoz": 65, "uvaduz": 65, "velmez": 65,
      "alpartaz": 65, "alcahaz": 65, "alcartaz": 65, "ajonuez": 65, "abenuz": 65, "adoratriz": 65, "aljez": 65,
      "belez": 65, "capuz": 65, "cariz": 65, "caz": 65, "cazuz": 65, "coz": 65, "cuz": 65,
      "dicaz": 65, "duz": 65, "feraz": 65, "habiz": 65, "hafiz": 65, "hamez": 65, "hertz": 65,
      "hez": 65, "hoz": 65, "jazz": 65, "jeliz": 65, "lataz": 65, "lapiz": 65, "matiz": 65,
      "maiz": 65, "miz": 65, "ninez": 65, "pajuz": 65, "prez": 65, "pomez": 65, "rahez": 65,
      "rapaz": 65, "refez": 65, "salaz": 65, "sauz": 65, "saz": 65, "socaz": 65, "solaz": 65,
      "sovoz": 65, "tunez": 65,
      "alferez": 85, "aljaraz": 85, "alquez": 85, "arrayaz": 85, "arraez": 85, "atramuz": 85, "avidez": 85,
      "badajoz": 85, "beodez": 85, "bocacaz": 85, "caduquez": 85, "candidez": 85, "chamariz": 85, "chapuz": 85,
      "codorniz": 85, "colapez": 85, "contumaz": 85, "cutrez": 85, "derechez": 85, "ductriz": 85, "eficaz": 85,
      "endeblez": 85, "esbeltez": 85, "fetidez": 85, "frigidez": 85, "gravidez": 85, "hetiquez": 85, "horridez": 85,
      "jaraiz": 85, "lenguaz": 85, "limpidez": 85, "lividez": 85, "malavez": 85, "malviz": 85, "matidez": 85,
      "mendaz": 85, "meretriz": 85, "mogataz": 85, "montaraz": 85, "morbidez": 85, "nitidez": 85, "orozuz": 85,
      "pardiez": 85, "parteluz": 85, "parvulez": 85, "pertinaz": 85, "pesantez": 85, "pollez": 85, "portapaz": 85,
      "portavoz": 85, "procaz": 85, "pugnaz": 85, "pulidez": 85, "putridez": 85, "quirguiz": 85, "rancidez": 85,
      "regaliz": 85, "robustez": 85, "rondiz": 85, "ronquez": 85, "satisfaz": 85, "secuaz": 85, "suspicaz": 85,
      "tamariz": 85, "tastaz": 85, "telliz": 85, "terliz": 85, "viudez": 85,
      "atractriz": 100, "brillantez": 100, "cantatriz": 100, "chochaperdiz": 100, "contrahaz": 100, "contraluz": 100, "delicadez": 100,
      "desfachatez": 100, "despotiquez": 100, "directriz": 100, "domestiquez": 100, "dominatriz": 100, "electromotriz": 100, "embriaguez": 100,
      "emperatriz": 100, "escualidez": 100, "espinapez": 100, "estitiquez": 100, "estolidez": 100, "exotiquez": 100, "flaccidez": 100,
      "generatriz": 100, "gilipollez": 100, "hectiquez": 100, "impavidez": 100, "insipidez": 100, "institutriz": 100, "intrepidez": 100,
      "languidez": 100, "lenguaraz": 100, "lobreguez": 100, "locomotriz": 100, "magnetomotriz": 100, "osculatriz": 100, "pedrojimenez": 100,
      "perspicaz": 100, "protectriz": 100, "reconditez": 100, "ridiculez": 100, "rustiquez": 100, "saltatriz": 100, "sobrecruz": 100,
      "sobrepelliz": 100, "sofistiquez": 100, "terriblez": 100
    }
  },
  {
    id: "pal-006", dailyId: "dia9-06", pack: "palabras",
    texto: "Palabra en español que empiece por la letra «K» o «W»",
    ejemplo: "wagneriano",
    answers: {
      "kilo": 10, "kilometro": 10, "kiwi": 10, "karate": 10, "koala": 10, "ketchup": 10, "karaoke": 10, "web": 10, "wifi": 10, "whisky": 10, "kilos": 10, "kilometros": 10, "kiwis": 10,
      "whatsapp": 25, "wikipedia": 25, "windows": 25, "word": 25, "walkman": 25, "water": 25, "wc": 25, "kebab": 25, "karma": 25, "kamikaze": 25, "king kong": 25, "kit kat": 25, "kleenex": 25, "kriptonita": 25, "kikos": 25, "wasap": 25, "wasa": 25, "vater": 25, "wallapop": 25, "wanda": 25, "willy": 25, "wtf": 25, "wow": 25, "wey": 25, "we": 25, "wii": 25, "world": 25, "warzone": 25, "work": 25, "wally": 25, "win": 25, "winner": 25, "white": 25, "weekend": 25, "whopper": 25, "koalas": 25, "kebabs": 25, "kitkat": 25, "klinex": 25, "kinder": 25, "kinder bueno": 25,
      "kefir": 45, "kimono": 45, "kayak": 45, "kiosco": 45, "kiosko": 45, "kilogramo": 45, "kilovatio": 45, "kilocaloria": 45, "kilohercio": 45, "kilobyte": 45, "karateca": 45, "kart": 45, "karting": 45, "katiuska": 45, "kermes": 45, "kermesse": 45, "kit": 45, "kitsch": 45, "krill": 45, "kung fu": 45, "kurdo": 45, "kuwaiti": 45, "keniata": 45, "keniano": 45, "kazajo": 45, "kosovar": 45, "waterpolo": 45, "waterpolista": 45, "windsurf": 45, "windsurfista": 45, "wok": 45, "wasabi": 45, "waffle": 45, "western": 45, "walkie talkie": 45, "wolframio": 45, "wiski": 45, "watt": 45, "watio": 45, "webcam": 45, "webinar": 45, "widget": 45, "kiko": 45, "katiuskas": 45, "kalimotxo": 45, "karts": 45, "kinki": 45, "quinqui": 45, "wario": 45, "wolverine": 45, "wonderbra": 45, "wrestling": 45, "wattpad": 45, "wii u": 45, "warcraft": 45, "world of warcraft": 45, "watts": 45, "watios": 45, "wireless": 45, "workout": 45, "workshop": 45, "wallpaper": 45, "walkie": 45, "walkies": 45, "wendy": 45, "waldo": 45, "wanda metropolitano": 45, "wave": 45, "wild": 45, "west": 45, "whiskas": 45, "wendys": 45, "ketchu": 45, "kechup": 45,
      "krausismo": 65, "krausista": 65, "kaiser": 65, "kan": 65, "kripton": 65, "kinesiologia": 65, "kinesiologo": 65, "kumquat": 65, "kirie": 65, "kirieleison": 65, "kibutz": 65, "kosher": 65, "kohl": 65, "kohol": 65, "kurdistan": 65, "kale borroka": 65, "kalashnikov": 65, "kombucha": 65, "kaki": 65, "kaolin": 65, "kapok": 65, "karst": 65, "karstico": 65, "kelvin": 65, "keroseno": 65, "kilopondio": 65, "kilolitro": 65, "kilometraje": 65, "kilometrico": 65, "wakeboard": 65, "wombat": 65, "wapiti": 65, "weber": 65, "whist": 65, "whiskey": 65, "wolfram": 65, "walkiria": 65, "walon": 65, "washingtoniano": 65, "ketamina": 65, "keta": 65, "wagner": 65, "wearable": 65, "watchlist": 65, "waterpolistas": 65, "windsurfer": 65, "wake": 65, "westerns": 65,
      "kopek": 85, "kraken": 85, "koljoz": 85, "kvas": 85, "kumis": 85, "kirguis": 85, "kirsch": 85, "kermesita": 85, "kimberlita": 85, "kainita": 85, "kernita": 85, "kieselgur": 85, "kieserita": 85, "kiloton": 85, "kilojulio": 85, "kinestesia": 85, "kendo": 85, "kenpo": 85, "kabuki": 85, "kakemono": 85, "koto": 85, "kalimba": 85, "kazoo": 85, "wigwam": 85, "wolframita": 85, "wurtzita": 85, "wellingtonia": 85, "weimares": 85, "westfaliano": 85,
      "wagneriano": 100, "wagnerismo": 100, "willemita": 100, "wollastonita": 100, "wulfenita": 100, "wavellita": 100, "witherita": 100, "kantiano": 100, "kantismo": 100, "kafkiano": 100, "keynesiano": 100, "keynesianismo": 100, "kurchatovio": 100, "kufico": 100
    }
  },
  {
    id: "pal-007", dailyId: "dia9-01", pack: "palabras",
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
    id: "pal-008", dailyId: "dia10-07", pack: "palabras",
    texto: "Palabra de origen árabe (arabismo en español)",
    ejemplo: "almuerza",
    answers: {
      "ojala": 10, "almohada": 10, "aceite": 10, "aceituna": 10, "azucar": 10, "alcalde": 10, "albañil": 10, "alcachofa": 10, "alfombra": 10, "ajedrez": 10, "aceitunas": 10,
      "ala": 25, "arabe": 25, "islam": 25, "coran": 25, "ramadan": 25, "burka": 25, "cuscus": 25, "kebab": 25, "shisha": 25, "hummus": 25, "sultan": 25, "ole": 25, "guadalquivir": 25, "alhambra": 25, "hala": 25, "hasta": 25, "alquiler": 25, "taza": 25, "jarra": 25, "sandia": 25, "fideo": 25, "fideos": 25, "albondiga": 25, "albondigas": 25, "tambor": 25, "dado": 25, "dados": 25, "tarea": 25, "jirafa": 25, "alquilar": 25, "alcaldesa": 25, "barrios": 25, "alfombras": 25, "tazas": 25, "jarras": 25, "limones": 25, "limonada": 25, "naranjas": 25, "zanahorias": 25, "sandias": 25, "alcachofas": 25, "guitarras": 25, "guitarrista": 25, "tareas": 25,
      "zanahoria": 45, "alfiler": 45, "alberca": 45, "almacen": 45, "arrecife": 45, "acequia": 45, "albaricoque": 45, "alhaja": 45, "jarabe": 45, "naranja": 45, "limon": 45, "berenjena": 45, "algodon": 45, "arroz": 45, "azafran": 45, "azahar": 45, "albahaca": 45, "tarifa": 45, "aduana": 45, "barrio": 45, "aldea": 45, "arrabal": 45, "zanja": 45, "mazapan": 45, "almibar": 45, "alcazar": 45, "alcazaba": 45, "mezquita": 45, "alquimia": 45, "algebra": 45, "algoritmo": 45, "cifra": 45, "cero": 45, "albornoz": 45, "azulejo": 45, "adobe": 45, "alcohol": 45, "guitarra": 45, "azul": 45, "marfil": 45, "momia": 45, "almacenes": 45, "alcaldia": 45, "aldeano": 45, "barriada": 45, "almohadon": 45, "alfileres": 45, "algodones": 45, "jarron": 45, "naranjo": 45, "berenjenas": 45, "aceitera": 45, "azucarero": 45, "azucarillo": 45, "tambores": 45, "tarifas": 45, "aduanas": 45, "asesinato": 45, "asesinar": 45, "momias": 45, "jirafas": 45, "bellotas": 45, "alcantarillas": 45, "zanjas": 45, "azoteas": 45,
      "alacran": 65, "jabali": 65, "alcali": 65, "almena": 65, "almazara": 65, "almadraba": 65, "alcornoque": 65, "albufera": 65, "alacena": 65, "alcoba": 65, "azotea": 65, "zaguan": 65, "tabique": 65, "alcantarilla": 65, "adoquin": 65, "noria": 65, "aljibe": 65, "adarve": 65, "alambique": 65, "albardilla": 65, "albacea": 65, "alferez": 65, "alguacil": 65, "almirante": 65, "zoco": 65, "atalaya": 65, "bellota": 65, "rehen": 65, "asesino": 65, "fulano": 65, "hazaña": 65, "albañileria": 65, "babucha": 65, "chilaba": 65, "laud": 65, "alfalfa": 65, "algarroba": 65, "azar": 65, "alfil": 65, "gazapo": 65, "arrozal": 65, "almibares": 65, "tamboril": 65, "rehenes": 65, "jabalies": 65, "gazapos": 65, "norias": 65, "acequias": 65, "aljibes": 65, "alcantarillado": 65, "tabiques": 65, "zaguanes": 65, "alcobas": 65,
      "rehala": 85, "alqueria": 85, "almadia": 85, "zalea": 85, "alfonci": 85, "acebuche": 85, "jaqueca": 85, "elixir": 85, "alcanfor": 85, "alquitran": 85, "azufre": 85, "azogue": 85, "zenit": 85, "nadir": 85, "acimut": 85, "arroba": 85, "fanega": 85, "albaran": 85, "arancel": 85, "tahona": 85, "jinete": 85, "alfanje": 85, "almirez": 85, "aldaba": 85, "alfeizar": 85, "algarabia": 85, "añil": 85, "albañal": 85, "gañan": 85, "alfeñique": 85,
      "almuerza": 100, "maravedi": 100, "alboronia": 100, "alcancia": 100, "acicate": 100, "almojarife": 100, "almotacen": 100, "almogavar": 100, "muladi": 100, "almocarabe": 100, "ataujia": 100, "taracea": 100, "guadamacil": 100, "añafil": 100, "azud": 100
    }
  },
  {
    id: "pal-009", dailyId: "dia11-04", pack: "palabras",
    texto: "Sinónimo en español de «enfadado» o «cabreado»",
    ejemplo: "mohino",
    answers: {
      "enojado": 10, "cabreado": 10, "furioso": 10, "molesto": 10, "irritado": 10, "indignado": 10, "rabioso": 10, "colerico": 10, "enfurecido": 10,
      "enfadado": 25, "mad": 25, "angry": 25, "hater": 25, "salty": 25, "tilt": 25, "tilteado": 25, "rayado": 25, "rallado": 25, "triste": 25, "loco": 25, "de mala leche": 25, "de mala hostia": 25, "de malas pulgas": 25, "hasta las narices": 25, "hasta el gorro": 25, "hasta la coronilla": 25, "hasta los huevos": 25, "mosca": 25, "picao": 25, "rayao": 25, "rallao": 25, "quemao": 25, "cabreao": 25, "enfadao": 25, "mosqueao": 25, "asqueao": 25, "chinao": 25, "rebota": 25, "rebotao": 25,
      "airado": 45, "mosqueado": 45, "encolerizado": 45, "ofendido": 45, "alterado": 45, "disgustado": 45, "resentido": 45, "malhumorado": 45, "crispado": 45, "exasperado": 45, "chinado": 45, "chinchado": 45, "harto": 45, "caliente": 45, "picado": 45, "quemado": 45, "rebotado": 45, "encendido": 45, "ardido": 45, "frustrado": 45, "fastidiado": 45, "contrariado": 45, "amargado": 45, "agrio": 45, "avinagrado": 45, "gruñon": 45, "cascarrabias": 45, "borde": 45, "arisco": 45, "brusco": 45, "aspero": 45, "tenso": 45, "nervioso": 45, "agitado": 45, "exaltado": 45, "desquiciado": 45, "fuera de si": 45, "echando chispas": 45, "echando humo": 45, "hecho una furia": 45, "negro": 45, "cruzado": 45, "torcido": 45, "encabronado": 45, "calentito": 45, "asqueado": 45, "frito": 45, "hinchado": 45, "bufado": 45, "fumando en pipa": 45, "de morros": 45, "hasta el moño": 45, "de uñas": 45, "de mal humor": 45, "amargao": 45, "quemadisimo": 45, "picadisimo": 45, "rayadisimo": 45, "ralladisimo": 45,
      "enconado": 65, "embravecido": 65, "repateado": 65, "sulfurado": 65, "irritadisimo": 65, "soliviantado": 65, "furibundo": 65, "encrespado": 65, "enrabietado": 65, "enrabiado": 65, "despechado": 65, "enfurruñado": 65, "ceñudo": 65, "huraño": 65, "hosco": 65, "adusto": 65, "refunfuñon": 65, "regañon": 65, "emperrado": 65, "emberrinchado": 65, "incordiado": 65, "escocido": 65, "resquemado": 65, "agraviado": 65, "ultrajado": 65, "dolido": 65, "herido": 65, "mortificado": 65, "humillado": 65, "enervado": 65, "acalorado": 65, "enardecido": 65, "exacerbado": 65, "endemoniado": 65, "endiablado": 65, "frenetico": 65, "energumeno": 65, "sacado de quicio": 65, "hecho un basilisco": 65, "trinando": 65, "con la mosca detras de la oreja": 65, "subiendose por las paredes": 65, "echando espuma por la boca": 65, "echando fuego": 65, "hecho un toro": 65, "hecho una fiera": 65, "que muerde": 65, "que trina": 65, "con un cabreo de mil demonios": 65, "con un rebote": 65, "de mal cafe": 65, "de mala gaita": 65, "de mala uva": 65, "de mala sombra": 65, "con los cables cruzados": 65, "cortocircuitado": 65, "rascado": 65, "escocio": 65, "vinagre": 65, "avinagrao": 65, "echando pestes": 65, "asao": 65,
      "mohino": 85, "amohinado": 85, "atrabiliario": 85, "iracundo": 85, "irascible": 85, "bilioso": 85, "ensañado": 85, "corajudo": 85, "encorajinado": 85, "encabritado": 85, "destemplado": 85, "desabrido": 85, "torvo": 85, "ofuscado": 85, "obcecado": 85, "descompuesto": 85, "estomagado": 85, "hastiado": 85, "hocicon": 85, "tostado": 85, "reconcomido": 85, "campanudo": 85, "picajoso": 85, "quisquilloso": 85, "encabronao": 85, "emputado": 85, "emputao": 85, "jodido": 85, "jodio": 85, "de mala ostia": 85, "con el culo torcido": 85, "hasta los cojones": 85, "hasta las pelotas": 85, "hasta los ovarios": 85, "hasta el coño": 85, "hasta la polla": 85, "hasta el nabo": 85, "hasta los mismisimos": 85, "con la sangre caliente": 85, "cagandose en todo": 85, "echando sapos y culebras": 85, "envenenado": 85, "envenenao": 85, "engorilado": 85, "engorilao": 85, "to loco": 85, "rotisimo": 85,
      "sañudo": 100, "sañoso": 100, "desasosegado": 100, "bilis": 100, "atrabilioso": 100, "amoscado": 100, "amostazado": 100, "atufado": 100, "emberrenchinado": 100, "iroso": 100, "corajoso": 100, "desbautizado": 100, "encorajado": 100, "con el culo virado": 100, "hasta el cipote": 100, "del higado": 100
    }
  },
  {
    id: "pal-010", dailyId: "dia12-02", pack: "palabras",
    texto: "Palabra o expresión coloquial en España para referirse al dinero",
    ejemplo: "parne",
    answers: {
      "pasta": 10, "guita": 10, "perras": 10, "cuartos": 10, "duros": 10, "plata": 10, "billetes": 10, "pavos": 10, "pelas": 10, "tela": 10,
      "dinero": 25, "euros": 25, "pesetas": 25, "dolares": 25, "money": 25, "cash": 25, "efectivo": 25, "metalico": 25, "tarjeta": 25, "bizum": 25, "bitcoin": 25, "cripto": 25, "oro": 25, "sueldo": 25, "capital": 25, "leuros": 25, "leuro": 25, "paga": 25, "nomina": 25, "propina": 25, "bote": 25, "euracos": 25, "eurillos": 25, "euretes": 25, "ks": 25, "un k": 25, "el sueldo": 25, "la paga": 25, "la nomina": 25, "la propina": 25, "el bote": 25, "un euro": 25,
      "parne": 45, "lana": 45, "viruta": 45, "lereles": 45, "lerele": 45, "panoja": 45, "pasta gansa": 45, "pastizal": 45, "un pastizal": 45, "paston": 45, "dineral": 45, "millonada": 45, "kilos": 45, "kilo": 45, "talegos": 45, "talego": 45, "pavo": 45, "duro": 45, "pela": 45, "perra": 45, "suelto": 45, "calderilla": 45, "chatarra": 45, "cambio": 45, "vuelta": 45, "vueltas": 45, "fajo": 45, "fajos": 45, "taco": 45, "mazo": 45, "fondos": 45, "ahorros": 45, "fortuna": 45, "riqueza": 45, "calas": 45, "cala": 45, "chapas": 45, "chinchin": 45, "monises": 45, "monis": 45, "napos": 45, "napo": 45, "billetaje": 45, "fortunon": 45, "aguinaldo": 45, "jornal": 45, "finiquito": 45, "sobresueldo": 45, "paga extra": 45, "extra": 45, "pension": 45, "paro": 45, "beca": 45, "subvencion": 45, "comision": 45, "caja": 45, "hucha": 45, "el paro": 45, "el finiquito": 45, "la pension": 45, "el aguinaldo": 45,
      "leña": 65, "manteca": 65, "mosca": 65, "vil metal": 65, "el vil metal": 65, "gallina": 65, "boniatos": 65, "boniato": 65, "verdes": 65, "verde": 65, "morados": 65, "bin laden": 65, "binladen": 65, "cinco duros": 65, "veinte duros": 65, "perra gorda": 65, "perra chica": 65, "chavos": 65, "chavo": 65, "ochavos": 65, "ochavo": 65, "reales": 65, "real": 65, "cobres": 65, "maravedies": 65, "maravedi": 65, "monedas": 65, "papel": 65, "papeles": 65, "pellizco": 65, "pico": 65, "riñon": 65, "un riñon": 65, "puñado": 65, "colchon": 65, "coste": 65, "propineja": 65, "flus": 65, "bicho": 65, "bichos": 65, "lechugas": 65, "lechuga": 65, "racimo": 65, "ladrillo": 65, "piquillo": 65, "piquito": 65, "monedillas": 65, "caldero": 65, "aca": 65, "forro": 65,
      "pastuqui": 85, "perrillas": 85, "pelillas": 85, "cuartejos": 85, "dineros": 85, "peculio": 85, "pecunia": 85, "numerario": 85, "liquidez": 85, "caudal": 85, "hacienda": 85, "haberes": 85, "mordida": 85, "sobre": 85, "astilla": 85, "tajada": 85, "morterada": 85, "mandanga": 85, "rubias": 85, "sin blanca": 85, "potosi": 85, "don dinero": 85, "manteca colora": 85, "pomada": 85, "sangre": 85, "unguento": 85, "crema": 85, "centenes": 85, "picorza": 85, "manises": 85, "biyuyos": 85, "ducal": 85, "jurdels": 85, "pan": 85, "trigo": 85, "harina": 85, "bacalao": 85, "pescao": 85, "tela marinera": 85, "un ojo de la cara": 85, "un huevo": 85, "un cojon": 85, "una mierda": 85, "ni un duro": 85, "ni un clavo": 85, "ni un chavo": 85, "ni papa": 85, "pelao": 85, "tieso": 85, "canino": 85, "el oro y el moro": 85,
      "jurdeles": 100, "jurdel": 100, "jurdo": 100, "jurdos": 100, "marmaja": 100, "talegada": 100, "chulapos": 100, "cumquibus": 100, "cum quibus": 100, "conquibus": 100, "parnes": 100, "jares": 100, "faltriquera": 100, "unguento amarillo": 100, "jallares": 100, "jayares": 100, "gandora": 100
    }
  },
  {
    id: "pal-011", dailyId: "dia12-06", pack: "palabras",
    texto: "Sigla lexicalizada o acrónimo de uso cotidiano en español",
    ejemplo: "inri",
    answers: {
      "ovni": 10, "sida": 10, "laser": 10, "radar": 10, "dni": 10, "itv": 10, "iva": 10, "uci": 10, "ong": 10, "vip": 10, "pc": 10, "web": 10, "app": 10, "dj": 10, "cd": 10,
      "ok": 25, "etc": 25, "sos": 25, "rip": 25, "lol": 25, "pdf": 25, "usb": 25, "wifi": 25, "gps": 25, "dvd": 25, "tv": 25, "ia": 25, "selectividad": 25, "tfg": 25, "tfm": 25, "pasaporte": 25, "cercanias": 25, "alsa": 25, "metro": 25, "bus": 25, "cpu": 25, "ram": 25, "jpg": 25, "gif": 25, "url": 25, "vpn": 25, "ip": 25, "npc": 25, "pov": 25, "wtf": 25, "omg": 25, "goat": 25, "mvp": 25, "hd": 25, "4k": 25, "mp3": 25, "mp4": 25, "png": 25, "www": 25, "sms": 25, "qr": 25, "hdmi": 25, "fps": 25, "gta": 25, "fifa": 25, "uefa": 25, "nba": 25, "f1": 25, "hbo": 25, "bachiller": 25, "uni": 25, "profe": 25, "insti": 25,
      "pyme": 45, "pymes": 45, "renfe": 45, "talgo": 45, "ave": 45, "adif": 45, "feve": 45, "dgt": 45, "boe": 45, "rae": 45, "aemet": 45, "eso": 45, "fp": 45, "ebau": 45, "evau": 45, "pau": 45, "uned": 45, "mir": 45, "uvi": 45, "irpf": 45, "iban": 45, "euribor": 45, "ipc": 45, "pib": 45, "tdt": 45, "led": 45, "pin": 45, "sim": 45, "ampa": 45, "apa": 45, "inem": 45, "sepe": 45, "erte": 45, "ere": 45, "otan": 45, "onu": 45, "unesco": 45, "unicef": 45, "oms": 45, "ue": 45, "fbi": 45, "cia": 45, "nasa": 45, "ouigo": 45, "iryo": 45, "emt": 45, "gpu": 45, "apk": 45, "fomo": 45, "mc": 45, "uhd": 45, "html": 45, "http": 45, "mms": 45, "nfc": 45, "ssd": 45, "hdd": 45, "rgb": 45, "rpg": 45, "acb": 45, "ufc": 45, "wwe": 45, "bbc": 45, "cnn": 45,
      "ceoe": 65, "ugt": 65, "ccoo": 65, "csif": 65, "once": 65, "rtve": 65, "tve": 65, "rne": 65, "efe": 65, "sgae": 65, "ifema": 65, "fitur": 65, "cni": 65, "cnp": 65, "tedax": 65, "geo": 65, "geas": 65, "seprona": 65, "ume": 65, "samur": 65, "summa": 65, "muface": 65, "imserso": 65, "aeat": 65, "cnmv": 65, "ibex": 65, "opa": 65, "ico": 65, "nie": 65, "nif": 65, "cif": 65, "bop": 65, "boc": 65, "tac": 65, "pcr": 65, "vih": 65, "adn": 65, "arn": 65, "tuvam": 65, "tussam": 65, "tmb": 65,
      "inri": 85, "sonar": 85, "modem": 85, "bit": 85, "pixel": 85, "codec": 85, "captcha": 85, "spam": 85, "bot": 85, "pulsar": 85, "cuasar": 85, "maser": 85, "scuba": 85, "taser": 85, "teflon": 85, "nailon": 85, "licra": 85, "velcro": 85, "emoticono": 85, "webinar": 85, "podcast": 85, "motel": 85, "fanzine": 85, "interpol": 85, "fogasa": 85, "aenor": 85, "ampel": 85, "sedena": 85,
      "ofimatica": 100, "informatica": 100, "telematica": 100, "domotica": 100, "burotica": 100, "tergal": 100, "bonobus": 100, "mupe": 100, "campsa": 100, "endesa": 100, "cepsa": 100, "seat": 100, "banesto": 100, "icona": 100, "benelux": 100, "mercosur": 100
    }
  },
  {
    id: "pal-012", dailyId: "dia13-05", pack: "palabras",
    texto: "Sufijo diminutivo/aumentativo o palabra común que lo lleve",
    ejemplo: "achon",
    answers: {
      "ito": 10, "ita": 10, "on": 10, "ona": 10, "azo": 10, "aza": 10, "illo": 10, "illa": 10, "casita": 10, "perrito": 10,
      "isimo": 25, "isima": 25, "mente": 25, "dor": 25, "cion": 25, "oso": 25, "able": 25, "ible": 25, "ero": 25, "era": 25, "ista": 25, "ismo": 25, "dad": 25, "momentito": 25, "tapita": 25, "cochazo": 25, "partidazo": 25, "peliculon": 25, "puñetazo": 25, "cabezazo": 25, "cañita": 25, "copita": 25, "chupito": 25, "bocadillo": 25, "vasito": 25, "besito": 25, "abracito": 25, "ratillo": 25, "poquillo": 25, "juegazo": 25, "fieston": 25,
      "ico": 45, "ica": 45, "in": 45, "ina": 45, "iño": 45, "iña": 45, "uco": 45, "uca": 45, "ete": 45, "eta": 45, "ote": 45, "ota": 45, "uelo": 45, "uela": 45, "ejo": 45, "eja": 45, "ucho": 45, "ucha": 45, "aco": 45, "aca": 45, "cito": 45, "cita": 45, "ecito": 45, "ecita": 45, "cillo": 45, "cilla": 45, "gatito": 45, "chiquito": 45, "pequeñito": 45, "poquito": 45, "ratito": 45, "cafelito": 45, "cervecita": 45, "cochecito": 45, "abuelito": 45, "pajarito": 45, "perrazo": 45, "golazo": 45, "temazo": 45, "cabezota": 45, "librote": 45, "novelon": 45, "cason": 45, "fortunon": 45, "guantazo": 45, "tortazo": 45, "portazo": 45, "balonazo": 45, "tontorron": 45, "birrita": 45, "pinchito": 45, "platito": 45, "momentillo": 45, "chiquilla": 45, "pequeñaja": 45, "pequeñajo": 45, "niñata": 45, "discazo": 45, "fotaza": 45, "casoplon": 45, "noticion": 45, "dramon": 45, "sueldazo": 45, "pastizal": 45,
      "acho": 65, "acha": 65, "ato": 65, "ata": 65, "orrio": 65, "orria": 65, "astro": 65, "astra": 65, "ango": 65, "anga": 65, "ales": 65, "oncho": 65, "uza": 65, "uzo": 65, "orro": 65, "ventanuco": 65, "chiquillo": 65, "pajarillo": 65, "pequeñin": 65, "chiquitin": 65, "mujerona": 65, "cabezon": 65, "narigon": 65, "barrigon": 65, "solteron": 65, "grandullon": 65, "moceton": 65, "libraco": 65, "pajarraco": 65, "bicharraco": 65, "casucha": 65, "pueblucho": 65, "perrucho": 65, "cuartucho": 65, "medicucho": 65, "gentuza": 65, "callejuela": 65, "plazuela": 65, "riachuelo": 65, "palabrota": 65, "festivalon": 65, "marronazo": 65,
      "achon": 85, "achona": 85, "uzco": 85, "uzca": 85, "ingo": 85, "inga": 85, "orio": 85, "iche": 85, "ezno": 85, "ezna": 85, "arraco": 85, "ijon": 85, "ejon": 85, "ullon": 85, "eton": 85, "ricachon": 85, "bonachon": 85, "frescachon": 85, "corpachon": 85, "villorrio": 85, "bodorrio": 85, "camastro": 85, "poetastro": 85, "pequeñuelo": 85, "niñato": 85, "señoritingo": 85, "lobezno": 85, "osezno": 85,
      "ingorrio": 100, "astron": 100, "erete": 100, "olacho": 100, "ezuelo": 100, "ezuela": 100, "zuelo": 100, "zuela": 100, "reyezuelo": 100, "ladronzuelo": 100, "pedrusco": 100, "peñasco": 100, "poblacho": 100, "vivales": 100, "frescales": 100
    }
  },
  {
    id: "pal-013", dailyId: "dia14-01", pack: "palabras",
    texto: "Sustantivo o adjetivo común que sea palabra esdrújula",
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
    id: "pal-014", dailyId: "dia14-05", pack: "palabras",
    texto: "Onomatopeya habitual en español",
    ejemplo: "pataplum",
    answers: {
      "guau": 10, "miau": 10, "pum": 10, "zas": 10, "mu": 10, "muu": 10, "pio": 10, "cuac": 10, "beee": 10, "kikiriki": 10, "jajaja": 10, "jeje": 10, "jiji": 10, "ja": 10, "uff": 10, "oh": 10, "eh": 10, "ah": 10,
      "boom": 25, "crash": 25, "bang": 25, "pow": 25, "splash": 25, "zap": 25, "boing": 25, "ring": 25, "ring ring": 25, "ding dong": 25, "oink": 25, "meow": 25, "woof": 25, "beep": 25, "click": 25, "crack": 25, "buah": 25, "bua": 25, "buaj": 25, "pff": 25, "pfff": 25, "pf": 25, "meh": 25, "tss": 25, "shhh": 25, "mmm": 25, "xd": 25, "lol": 25, "wtf": 25, "omg": 25,
      "tic tac": 45, "tictac": 45, "toc toc": 45, "achis": 45, "glu glu": 45, "gluglu": 45, "pio pio": 45, "piopio": 45, "guau guau": 45, "miau miau": 45, "bee": 45, "mee": 45, "croac": 45, "cri cri": 45, "quiquiriqui": 45, "cloc": 45, "clic": 45, "crac": 45, "chas": 45, "chof": 45, "plaf": 45, "plas": 45, "plash": 45, "cataplum": 45, "paf": 45, "puf": 45, "uf": 45, "ay": 45, "uy": 45, "bah": 45, "shh": 45, "chist": 45, "psst": 45, "ñam": 45, "ñam ñam": 45, "ja ja": 45, "je je": 45, "ji ji": 45, "jo jo": 45, "jaja": 45, "blablabla": 45, "brr": 45, "zzz": 45, "cof cof": 45, "cof": 45, "brrr": 45, "muak": 45, "mua": 45, "zaska": 45, "traca": 45, "ratatata": 45, "ratata": 45, "brum brum": 45, "ñi": 45, "cricri": 45, "bla bla": 45, "bla bla bla": 45, "ag": 45, "agg": 45, "agh": 45, "pam": 45, "pim": 45, "ole": 45,
      "bum": 65, "zum": 65, "bzzz": 65, "ssss": 65, "bof": 65, "baf": 65, "zasca": 65, "patapum": 65, "patatras": 65, "catacrac": 65, "catapun": 65, "pumba": 65, "chim pum": 65, "chimpun": 65, "tachan": 65, "clin": 65, "clinc": 65, "clan": 65, "clon": 65, "talan": 65, "tilin": 65, "tolon": 65, "din don": 65, "tan tan": 65, "chucu chucu": 65, "chu chu": 65, "run run": 65, "runrun": 65, "brum": 65, "piii": 65, "mec mec": 65, "moc moc": 65, "muac": 65, "snif": 65, "glup": 65, "hip": 65, "puaj": 65, "ecs": 65, "arg": 65, "chuik": 65, "puag": 65, "iu": 65, "iugh": 65, "plop": 65, "plof": 65, "clac": 65, "tric": 65, "trac": 65, "juas": 65, "juas juas": 65, "juju": 65, "jojo": 65, "jojojo": 65, "buah chaval": 65, "ojito": 65, "epa": 65, "epale": 65, "upa": 65, "ale": 65, "hala": 65, "arsa": 65, "oma": 65,
      "zis zas": 85, "tris tras": 85, "pif paf": 85, "pim pam": 85, "pim pam pum": 85, "rataplan": 85, "tarara": 85, "tururu": 85, "tutu": 85, "chinchin": 85, "fru fru": 85, "chas chas": 85, "tris": 85, "tras": 85, "pif": 85, "bubu": 85, "clo clo": 85, "co co": 85, "cucu": 85, "uh uh": 85, "auuu": 85, "grrr": 85, "ron ron": 85, "ric rac": 85, "ñic": 85, "ñiqui ñiqui": 85, "fap": 85, "fap fap": 85, "ñiqui": 85, "ñaca": 85, "ñaca ñaca": 85, "toma ya": 85, "zascandil": 85, "catapum": 85, "chupate esa": 85, "prff": 85, "poto": 85, "buag": 85, "argg": 85, "grrrr": 85, "rrr": 85, "psss": 85, "chss": 85, "buaaa": 85, "guaa": 85,
      "pataplum": 100, "frufru": 100, "tarari": 100, "chaf": 100, "tararatata": 100, "cataplun": 100, "patatin": 100, "patatan": 100, "taratachin": 100, "tantarantan": 100, "chischas": 100, "tristras": 100, "ziszas": 100, "arrorro": 100, "ñeee": 100, "mecachis": 100
    }
  },
  {
    id: "pal-015", dailyId: "dia15-03", pack: "palabras",
    texto: "Sinónimo en español de «engaño», «estafa» o «mentira»",
    ejemplo: "artilugio",
    answers: {
      "timo": 10, "fraude": 10, "mentira": 10, "engaño": 10, "estafa": 10, "trampa": 10, "bulo": 10, "embuste": 10, "trola": 10, "farsa": 10,
      "fake": 25, "fake news": 25, "scam": 25, "phishing": 25, "clickbait": 25, "spam": 25, "estafa piramidal": 25, "ponzi": 25, "humo": 25, "politica": 25, "promesa": 25, "ilusion": 25, "cuento chino": 25, "ficcion": 25, "bait": 25, "vendehumos": 25, "vende humos": 25, "ghosting": 25, "catfish": 25, "spoiler": 25, "troleo": 25, "trol": 25,
      "cuento": 45, "patraña": 45, "bola": 45, "camelo": 45, "enredo": 45, "chanchullo": 45, "artimaña": 45, "infundio": 45, "falacia": 45, "embrollo": 45, "pilleria": 45, "tocomocho": 45, "sisa": 45, "milonga": 45, "invencion": 45, "ardid": 45, "celada": 45, "triquiñuela": 45, "jugarreta": 45, "treta": 45, "truco": 45, "fantasmada": 45, "farol": 45, "chorizada": 45, "robo": 45, "atraco": 45, "sablazo": 45, "clavada": 45, "palo": 45, "pufo": 45, "tongo": 45, "amaño": 45, "apaño": 45, "montaje": 45, "paripe": 45, "teatro": 45, "comedia": 45, "pantomima": 45, "simulacro": 45, "impostura": 45, "falsedad": 45, "calumnia": 45, "moto": 45, "vender la moto": 45, "pirula": 45, "la pirula": 45, "pua": 45, "trapicheo": 45, "marron": 45, "coba": 45, "gato por liebre": 45, "jugada": 45, "invent": 45, "inventada": 45, "postureo": 45, "pelicula": 45, "historia": 45, "rollo": 45, "chiste": 45, "broma": 45,
      "engatuse": 65, "tangana": 65, "pega": 65, "chicana": 65, "argucia": 65, "trapisonda": 65, "trinquete": 65, "embuchado": 65, "gatuperio": 65, "tramoya": 65, "tangada": 65, "doblaje": 65, "estampita": 65, "pelotazo": 65, "corruptela": 65, "mordida": 65, "cohecho": 65, "desfalco": 65, "malversacion": 65, "usurpacion": 65, "suplantacion": 65, "falsificacion": 65, "simulacion": 65, "fingimiento": 65, "supercheria": 65, "charlataneria": 65, "fulleria": 65, "picardia": 65, "granujada": 65, "canallada": 65, "encerrona": 65, "emboscada": 65, "añagaza": 65, "maraña": 65, "chiringuito": 65, "mamandurria": 65, "difamacion": 65, "hipocresia": 65, "dar gato por liebre": 65, "pufazo": 65, "triple": 65, "tirarse un triple": 65, "tirarse el pisto": 65, "tirarse el moco": 65, "moco": 65, "pegote": 65, "papel": 65, "papelon": 65, "montarse una pelicula": 65, "historieta": 65, "rollo macabeo": 65, "inocentada": 65, "vacile": 65, "quedada": 65, "bacala": 65, "la bacala": 65, "meter la bacala": 65, "gambazo": 65, "chanchullada": 65, "enjuague": 65, "pastel": 65, "tostada": 65,
      "insidia": 85, "dolo": 85, "perfidia": 85, "alevosia": 85, "maquinacion": 85, "faramalla": 85, "embaucamiento": 85, "sollado": 85, "subterfugio": 85, "estratagema": 85, "asechanza": 85, "acechanza": 85, "mistificacion": 85, "mixtificacion": 85, "fabula": 85, "quimera": 85, "paparrucha": 85, "habladuria": 85, "infamia": 85, "mendacidad": 85, "duplicidad": 85, "doblez": 85, "felonia": 85, "intriga": 85, "conjura": 85, "complot": 85, "confabulacion": 85, "putada": 85, "hijoputada": 85, "cabronada": 85, "guarrada": 85, "cerdada": 85, "perrada": 85, "mamoneo": 85, "compadreo": 85, "enchufe": 85, "dedazo": 85, "choriceo": 85, "mangoneo": 85, "afano": 85, "soplapollez": 85, "gilipollez": 85, "mierda": 85, "bullshit": 85, "cama": 85, "hacer la cama": 85, "la trece catorce": 85, "13 14": 85, "la envolvente": 85, "hacer la envolvente": 85, "trilerismo": 85, "trile": 85,
      "artilugio": 100, "engaitamiento": 100, "socaliña": 100, "zaragatero": 100, "engañifa": 100, "engañabobos": 100, "mohatra": 100, "barateria": 100, "estelionato": 100, "camama": 100, "filfa": 100, "andromina": 100, "embeleco": 100, "trapaza": 100, "trampa saducea": 100
    }
  },
  {
    id: "pal-016", dailyId: "dia16-07", pack: "palabras",
    texto: "Palabra del castellano que empiece por la letra «Z»",
    ejemplo: "zamarra",
    answers: {
      "zapato": 10, "zanahoria": 10, "zumo": 10, "zorro": 10, "zona": 10, "zoo": 10, "zoologico": 10, "zurdo": 10, "zarza": 10, "zapatilla": 10, "zapatos": 10, "zapatillas": 10, "zanahorias": 10, "zumos": 10,
      "zeta": 25, "zombie": 25, "zombi": 25, "zoom": 25, "zen": 25, "zero": 25, "zaragoza": 25, "zamora": 25, "zarauz": 25, "zara": 25, "zelda": 25, "zeus": 25, "zoro": 25, "zumo de naranja": 25, "zapa": 25, "zapas": 25, "zaska": 25, "zasca": 25, "zorros": 25, "zombis": 25, "zombies": 25, "zurda": 25, "zurdos": 25, "zumito": 25, "zas": 25, "zero azucar": 25, "zonas": 25, "zoologicos": 25, "zoos": 25,
      "zueco": 45, "zafiro": 45, "zumbido": 45, "zumbar": 45, "zagal": 45, "zarzuela": 45, "zarzamora": 45, "zancada": 45, "zancadilla": 45, "zanco": 45, "zaguero": 45, "zaguan": 45, "zalamero": 45, "zarpa": 45, "zarpazo": 45, "zumbador": 45, "zambomba": 45, "zascandil": 45, "zoquete": 45, "zopenco": 45, "zepelin": 45, "zulo": 45, "zurron": 45, "zafarrancho": 45, "zanja": 45, "zarandear": 45, "zarandeo": 45, "zambullida": 45, "zambullir": 45, "zampar": 45, "zampabollos": 45, "zangano": 45, "zancudo": 45, "zapatero": 45, "zapateria": 45, "zapateado": 45, "zar": 45, "zarina": 45, "zafarse": 45, "zafar": 45, "zocalo": 45, "zodiaco": 45, "zumbon": 45, "zumbado": 45, "zuecos": 45, "zulos": 45, "zascas": 45, "zaskas": 45, "zampado": 45, "zamparse": 45, "zanganos": 45, "zoquetes": 45, "zumbada": 45, "zumbados": 45, "zarzamoras": 45, "zambombas": 45, "zancadillas": 45, "zancos": 45, "zanjas": 45, "zarpas": 45, "zarpazos": 45, "zodiacos": 45, "zumbidos": 45, "zancadas": 45, "zapatazo": 45, "zapatito": 45, "zapatilla deportiva": 45,
      "zoco": 65, "zalea": 65, "zamarra": 65, "zanganear": 65, "zarabanda": 65, "zaleo": 65, "zalameria": 65, "zozobra": 65, "zozobrar": 65, "zarrapastroso": 65, "zaragatear": 65, "zootecnia": 65, "zoologia": 65, "zoologo": 65, "zoonosis": 65, "zigurat": 65, "zigzag": 65, "zigzaguear": 65, "zinc": 65, "zircon": 65, "zirconio": 65, "zopilote": 65, "zorzal": 65, "zorrilla": 65, "zorruno": 65, "zorrera": 65, "zampoña": 65, "zahareño": 65, "zaherir": 65, "zahori": 65, "zahurda": 65, "zalema": 65, "zamacuco": 65, "zamarrear": 65, "zamarreo": 65, "zapador": 65, "zaragata": 65, "zaraguelles": 65, "zaranda": 65, "zarrio": 65, "zorra": 65, "zurullo": 65, "zamarras": 65, "zascandiles": 65, "zopencos": 65, "zurullos": 65, "zurrados": 65, "zurrones": 65, "zafo": 65, "zafada": 65, "zafado": 65, "zampada": 65, "zampon": 65, "zapaton": 65, "zarandeado": 65, "zenit": 65, "zepelines": 65, "zigzags": 65, "zocalos": 65,
      "zagual": 85, "zanquilargo": 85, "zarracina": 85, "zurriagazo": 85, "zurriago": 85, "zurrapa": 85, "zurrumbico": 85, "zascandilear": 85, "zapoteco": 85, "zatico": 85, "zopencada": 85, "zurcir": 85, "zurcido": 85, "zurrar": 85, "zurra": 85, "zumacal": 85, "zumaque": 85, "zumbel": 85, "zuñir": 85, "zuñido": 85, "zaida": 85, "zaino": 85, "zalagarda": 85, "zambra": 85, "zaraza": 85, "zorron": 85, "zarrio viejo": 85, "zascandileando": 85, "zopenquez": 85, "zoquetada": 85, "zorrear": 85, "zorrerias": 85,
      "zampatortas": 100, "zaragutear": 100, "zurcefayas": 100, "zamarrico": 100, "zangolotino": 100, "zangolotear": 100, "zaquizami": 100, "zarramplin": 100, "zarzaparrilla": 100, "zocato": 100, "zollipar": 100, "zurumbatico": 100, "zuzon": 100
    }
  },
  /* ===================== PROMPTS DE PRUEBA DE LOS PACKS TEMÁTICOS ===================== */
  {
    id: "pal-001", dailyId: "dia5-03", pack: "palabras",
    texto: "Objeto, material o alimento que puedas romper, partir o rasgar con tus propias manos",
    ejemplo: "pan de oro",
    answers: {
      "papel": 10, "folio": 10, "servilleta": 10, "huevo": 10, "cascara": 10, "galleta": 10, "chocolate": 10, "pan": 10, "palillo": 10, "rama": 10, "hoja": 10, "flor": 10, "lapiz": 10, "bolsa": 10, "globo": 10, "uña": 10, "pelo": 10, "vaso": 10, "plato": 10, "copa": 10, "cristal": 10, "cuerda": 10,
      "carton": 25, "onza": 25, "barra de pan": 25, "mondadientes": 25, "palo": 25, "tallo": 25, "tiza": 25, "boligrafo": 25, "vaso de plastico": 25, "plato de plastico": 25, "sobre": 25, "sello": 25, "entrada": 25, "ticket": 25, "billete": 25, "hilo": 25, "lana": 25, "goma": 25, "goma elastica": 25, "condon": 25, "preservativo": 25, "pastilla": 25, "capsula": 25, "nuez": 25, "cacahuete": 25, "pipa": 25, "pistacho": 25, "almendra": 25, "cigarro": 25, "pitillo": 25, "cerilla": 25, "fosforo": 25, "burbuja": 25, "corcho": 25, "cabello": 25, "media": 25, "pantis": 25, "camiseta": 25, "tela": 25, "trapo": 25, "juguete": 25, "lego": 25, "gafas": 25, "hielo": 25, "pasta": 25,
      "galleta napolitana": 45, "napolitana": 45, "barquillo": 45, "pico": 45, "regaña": 45, "colin": 45, "picos": 45, "colines": 45, "mina": 45, "cuerda fina": 45, "blister": 45, "bliste": 45, "ampolla": 45, "puro": 45, "filtro": 45, "plastico de burbujas": 45, "porexpan": 45, "padrastro": 45, "cd": 45, "dvd": 45, "cinta": 45, "casete": 45, "patilla": 45, "cristal fino": 45, "cascara de huevo": 45, "cascara de nuez": 45, "cascara de pipa": 45, "onza de chocolate": 45, "tableta de chocolate": 45, "corteza": 45, "patata frita": 45, "nachos": 45, "tortita": 45, "tostada": 45, "rosquilla": 45, "magdalena": 45, "bizcocho": 45, "cruasan": 45, "hoja de papel": 45, "hoja seca": 45, "ramita": 45, "petalo": 45, "spaghetti": 45, "spaghettis": 45, "espagueti": 45, "espaguetis": 45,
      "corcho blanco": 65, "poliestireno": 65, "espuma": 65, "esponja": 65, "tiza de pizarra": 65, "mina de lapiz": 65, "punta de lapiz": 65, "rotulador": 65, "cera": 65, "plastilina": 65, "arcilla": 65, "barro": 65, "yeso": 65, "escayola": 65, "galleta maria": 65, "oblea": 65, "pan de molde": 65, "hogaza": 65, "mollete": 65, "regañas": 65,
      "lacre": 85, "sello de lacre": 85, "papiro": 85, "pergamino": 85, "papel cebolla": 85, "papel de seda": 85, "papel de fumar": 85, "papel de liar": 85, "papel secante": 85, "papel crepe": 85, "papel pinocho": 85, "papel charol": 85,
      "pan de oro": 100, "hostia consagrada": 100, "hostia": 100, "barquillo de oblea": 100, "papel de arroz": 100, "papel de azucar": 100, "filigrana": 100, "origami": 100, "papiroflexia": 100, "capullo de seda": 100
    }
  },
  {
    id: "pal-002", dailyId: "dia6-01", pack: "palabras",
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
  /* ----- Dossier Palabras y Lenguaje · Capítulo 3 (Continuación pal-017 a pal-021) ----- */
  {
    id: "pal-017", dailyId: "dia17-07", pack: "palabras",
    texto: "Extranjerismo o anglicismo de uso diario en España",
    ejemplo: "spoiler",
    answers: {}
  },
  {
    id: "pal-018", dailyId: "dia17-04", pack: "palabras",
    texto: "Animal utilizado habitualmente como insulto o apelativo coloquial en español",
    ejemplo: "buitre",
    answers: {}
  },
  {
    id: "pal-019", dailyId: "dia18-03", pack: "palabras",
    texto: "Palabra aguda terminada en vocal con tilde",
    ejemplo: "colibri",
    answers: {}
  },
  {
    id: "pal-020", dailyId: "dia19-05", pack: "palabras",
    texto: "Sinónimo o término coloquial para referirse a estar borracho o a una borrachera",
    ejemplo: "melopea",
    answers: {}
  },
  {
    id: "pal-021", dailyId: "dia19-02", pack: "palabras",
    texto: "Verbo irregular común en español en infinitivo",
    ejemplo: "ir",
    answers: {}
  },
  {
    id: "pel-001", dailyId: "dia5-06", pack: "peliculas",
    texto: "Película de animación de Disney o Pixar",
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
    id: "pel-002", dailyId: "dia5-05", pack: "peliculas",
    texto: "Película cuya historia transcurra en un barco, submarino o en pleno mar",
    ejemplo: "el acorazado potemkin",
    answers: {
      "titanic": 10, "tiburon": 10, "piratas del caribe": 10, "buscando a nemo": 10, "nemo": 10, "la sirenita": 10, "sirenita": 10, "naufrago": 10, "vaiana": 10, "moana": 10,
      "aquaman": 25, "avatar el sentido del agua": 25, "el sentido del agua": 25, "bob esponja": 25, "bob esponja la pelicula": 25, "buscando a dory": 25, "el espantatiburones": 25, "espantatiburones": 25, "liberad a willy": 25, "megalodon": 25, "the meg": 25, "sharknado": 25, "luca": 25, "ponyo": 25, "ponyo en el acantilado": 25, "atlantis": 25, "mar adentro": 25,
      "la vida de pi": 45, "vida de pi": 45, "la tormenta perfecta": 45, "tormenta perfecta": 45, "capitan phillips": 45, "waterworld": 45, "master and commander": 45, "moby dick": 45, "poseidon": 45, "la aventura del poseidon": 45, "20000 leguas de viaje submarino": 45, "veinte mil leguas de viaje submarino": 45, "el lago azul": 45, "lago azul": 45, "la playa": 45, "infierno azul": 45, "the shallows": 45, "a 47 metros": 45, "deep blue sea": 45, "tiburon 2": 45, "megalodon 2": 45, "en el corazon del mar": 45, "robinson crusoe": 45, "la isla del tesoro": 45, "isla del tesoro": 45, "simbad": 45, "simbad la leyenda de los siete mares": 45, "dunkerque": 45, "pearl harbor": 45, "battleship": 45, "locos por el surf": 45, "le llaman bodhi": 45, "point break": 45, "soul surfer": 45, "flipper": 45, "el triangulo de la tristeza": 45, "triangulo de la tristeza": 45,
      "la caza del octubre rojo": 65, "octubre rojo": 65, "das boot": 65, "el submarino": 65, "marea roja": 65, "u 571": 65, "u571": 65, "k 19": 65, "k19": 65, "hunter killer": 65, "greyhound": 65, "greyhound enemigos bajo el mar": 65, "abyss": 65, "the abyss": 65, "el abismo": 65, "esfera": 65, "sphere": 65, "underwater": 65, "leviathan": 65, "ghost ship": 65, "barco fantasma": 65, "open water": 65, "a la deriva": 65, "adrift": 65, "cuando todo esta perdido": 65, "all is lost": 65, "kon tiki": 65, "kontiki": 65, "el gran azul": 65, "le grand bleu": 65, "oceanos": 65, "calma total": 65, "dead calm": 65, "triangle": 65, "el triangulo": 65, "rebelion a bordo": 65, "motin a bordo": 65, "capitanes intrepidos": 65, "la isla de las cabezas cortadas": 65, "la isla de nim": 65, "el monstruo marino": 65,
      "el faro": 85, "the lighthouse": 85, "life aquatic": 85, "el ultimo viaje del demeter": 85, "el señor de las moscas": 85, "señor de las moscas": 85, "tormenta blanca": 85, "white squall": 85, "la hora decisiva": 85, "the finest hours": 85, "kursk": 85, "black sea": 85, "mar negro": 85, "el canto del lobo": 85, "operacion pacifico": 85, "duelo en el atlantico": 85, "hundid el bismarck": 85, "el viejo y el mar": 85, "viejo y el mar": 85, "orca la ballena asesina": 85, "orca": 85, "piraña": 85, "deep rising": 85, "virus": 85, "el motin del caine": 85, "motin del caine": 85, "billy budd": 85, "los niños del mar": 85, "iron lung": 85,
      "el acorazado potemkin": 100, "acorazado potemkin": 100, "blackfish": 100, "the cove": 100, "mi maestro el pulpo": 100, "el mundo del silencio": 100, "leviatan": 100, "stromboli": 100, "los contrabandistas de moonfleet": 100, "moonfleet": 100, "naufragos": 100, "el navegante": 100, "tabu": 100, "el gran miercoles": 100
    }
  },
  {
    id: "pel-003", dailyId: "dia6-06", pack: "peliculas",
    texto: "Película ganadora del Óscar a Mejor Película",
    ejemplo: "alas",
    answers: {
      "titanic": 10, "gladiator": 10, "el padrino": 10, "padrino": 10, "forrest gump": 10, "parasitos": 10, "oppenheimer": 10, "el señor de los anillos": 10, "señor de los anillos": 10, "casablanca": 10, "ben hur": 10, "lo que el viento se llevo": 10, "braveheart": 10, "el silencio de los corderos": 10, "silencio de los corderos": 10, "el gladiador": 10, "el retorno del rey": 10, "el señor de los anillos el retorno del rey": 10, "la lista de schindler": 10, "lista de schindler": 10, "rocky": 10, "slumdog millionaire": 10,
      "avatar": 25, "star wars": 25, "la guerra de las galaxias": 25, "pulp fiction": 25, "origen": 25, "inception": 25, "interstellar": 25, "el caballero oscuro": 25, "caballero oscuro": 25, "ciudadano kane": 25, "psicosis": 25, "matrix": 25, "cadena perpetua": 25, "salvar al soldado ryan": 25, "el resplandor": 25, "jurassic park": 25, "parque jurasico": 25, "et": 25, "tiburon": 25, "apocalypse now": 25,
      "sin perdon": 45, "chicago": 45, "una mente maravillosa": 45, "amadeus": 45, "el golpe": 45, "patton": 45, "el padrino ii": 45, "el padrino 2": 45, "infiltrados": 45, "los infiltrados": 45, "no es pais para viejos": 45, "mente maravillosa": 45, "american beauty": 45, "shakespeare in love": 45, "shakespeare enamorado": 45, "el paciente ingles": 45, "paciente ingles": 45, "bailando con lobos": 45, "rain man": 45, "platoon": 45, "memorias de africa": 45, "gandhi": 45, "carros de fuego": 45, "kramer contra kramer": 45, "alguien volo sobre el nido del cuco": 45, "the sting": 45, "french connection": 45, "contra el imperio de la droga": 45, "west side story": 45, "sonrisas y lagrimas": 45, "lawrence de arabia": 45, "el puente sobre el rio kwai": 45, "puente sobre el rio kwai": 45, "todo a la vez en todas partes": 45, "green book": 45, "la forma del agua": 45, "12 años de esclavitud": 45, "argo": 45,
      "moonlight": 65, "spotlight": 65, "coda": 65, "the artist": 65, "en tierra hostil": 65, "the hurt locker": 65, "nomadland": 65, "birdman": 65, "crash": 65, "paseando a miss daisy": 65, "driving miss daisy": 65, "el ultimo emperador": 65, "ultimo emperador": 65, "la fuerza del cariño": 65, "fuerza del cariño": 65, "gente corriente": 65, "el cazador": 65, "the deer hunter": 65, "annie hall": 65, "en el calor de la noche": 65, "un hombre para la eternidad": 65, "my fair lady": 65, "tom jones": 65, "el apartamento": 65, "apartamento": 65, "gigi": 65, "la vuelta al mundo en 80 dias": 65, "la ley del silencio": 65,
      "oliver": 85, "cowboy de medianoche": 85, "midnight cowboy": 85, "marty": 85, "el politico": 85, "hamlet": 85, "la barrera invisible": 85, "los mejores años de nuestra vida": 85, "dias sin huella": 85, "siguiendo mi camino": 85, "going my way": 85, "la señora miniver": 85, "señora miniver": 85, "que verde era mi valle": 85, "vive como quieras": 85, "la vida de emile zola": 85, "el gran ziegfeld": 85, "sucedio una noche": 85, "rebelion a bordo": 85, "el motin del bounty": 85,
      "alas": 100, "wings": 100, "la melodia de broadway": 100, "melodia de broadway": 100, "cabalgata": 100, "cavalcade": 100, "el delator": 100, "the informer": 100, "el bazar de las sorpresas": 100, "amanecer": 100, "sunrise": 100, "septimo cielo": 100, "seventh heaven": 100, "la patrulla perdida": 100
    }
  },
  {
    id: "pel-004", dailyId: "dia7-03", pack: "peliculas",
    texto: "Película de ciencia ficción, viajes espaciales o futuro distópico",
    ejemplo: "viaje a la luna",
    answers: {
      "star wars": 10, "la guerra de las galaxias": 10, "interstellar": 10, "matrix": 10, "avatar": 10, "alien": 10, "regreso al futuro": 10,
      "terminator": 10, "dune": 10, "guerra de las galaxias": 10, "the matrix": 10, "alien el octavo pasajero": 10, "et": 10, "et el extraterrestre": 10,
      "jurassic park": 10, "parque jurasico": 10, "origen": 10, "inception": 10, "los juegos del hambre": 10, "juegos del hambre": 10, "wall e": 10,
      "el señor de los anillos": 25, "harry potter": 25, "spiderman": 25, "batman": 25, "superman": 25, "iron man": 25, "armageddon": 25,
      "gravity": 25, "marte": 25, "the martian": 25, "el marciano": 25, "yo robot": 25, "i robot": 25, "soy leyenda": 25,
      "guerra mundial z": 25, "independence day": 25, "transformers": 25, "godzilla": 25, "king kong": 25, "pacific rim": 25,
      "blade runner": 45, "2001 una odisea del espacio": 45, "llegada": 45, "la llegada": 45, "ex machina": 45, "gattaca": 45, "hijos de los hombres": 45,
      "distrito 9": 45, "el quinto elemento": 45, "quinto elemento": 45, "minority report": 45, "desafio total": 45, "robocop": 45, "mad max": 45,
      "2001 odisea del espacio": 45, "odisea del espacio": 45, "arrival": 45, "district 9": 45, "total recall": 45, "mad max furia en la carretera": 45, "el planeta de los simios": 45,
      "planeta de los simios": 45, "la guerra de los mundos": 45, "guerra de los mundos": 45, "terminator 2": 45, "aliens": 45, "aliens el regreso": 45, "depredador": 45,
      "predator": 45, "la cosa": 45, "the thing": 45, "encuentros en la tercera fase": 45, "inteligencia artificial": 45, "el show de truman": 45, "her": 45,
      "donnie darko": 45, "el efecto mariposa": 45, "looper": 45, "al filo del mañana": 45,
      "moon": 65, "stalker": 65, "solaris": 65, "akira": 65, "brazil": 65, "dark city": 65, "la naranja mecanica": 65,
      "naranja mecanica": 65, "12 monos": 65, "doce monos": 65, "v de vendetta": 65, "watchmen": 65, "starship troopers": 65, "las brigadas del espacio": 65,
      "stargate": 65, "tron": 65, "tron legacy": 65, "el juego de ender": 65, "el gigante de hierro": 65, "ghost in the shell": 65, "la mosca": 65,
      "the fly": 65, "el hombre bicentenario": 65, "contact": 65, "señales": 65, "super 8": 65, "monstruoso": 65,
      "coherence": 85, "primer": 85, "predestination": 85, "los cronocrimenes": 85, "cronocrimenes": 85, "el hoyo": 85, "cube": 85,
      "el cubo": 85, "pi fe en el caos": 85, "existenz": 85, "videodrome": 85, "scanners": 85, "estan vivos": 85, "they live": 85,
      "el abismo": 85, "abyss": 85, "esfera": 85, "planeta prohibido": 85, "ultimatum a la tierra": 85, "la invasion de los ladrones de cuerpos": 85,
      "metropolis": 100, "viaje a la luna": 100, "le voyage dans la lune": 100, "la jetee": 100, "el planeta salvaje": 100, "planeta salvaje": 100, "la planete sauvage": 100,
      "kin dza dza": 100, "un chico y su perro": 100, "el hombre con rayos x en los ojos": 100, "el increible hombre menguante": 100, "increible hombre menguante": 100, "quatermass": 100, "la amenaza de andromeda": 100,
      "aniara": 100
    }
  },
  {
    id: "pel-005", dailyId: "dia7-01", pack: "peliculas",
    texto: "Director o directora de cine (internacional o español)",
    ejemplo: "segundo de chomon",
    answers: {
      "steven spielberg": 10, "spielberg": 10, "christopher nolan": 10, "nolan": 10, "quentin tarantino": 10, "tarantino": 10, "martin scorsese": 10, "scorsese": 10, "pedro almodovar": 10, "almodovar": 10, "alejandro amenabar": 10, "amenabar": 10, "james cameron": 10, "cameron": 10, "tim burton": 10, "burton": 10, "alfred hitchcock": 10, "hitchcock": 10, "stanley kubrick": 10, "kubrick": 10, "george lucas": 10, "lucas": 10,
      "guillermo del toro": 25, "alex de la iglesia": 25, "juan antonio bayona": 25, "bayona": 25, "walt disney": 25, "disney": 25, "santiago segura": 25, "j a bayona": 25, "del toro": 25, "peter jackson": 25, "zack snyder": 25, "michael bay": 25, "j j abrams": 25, "mel gibson": 25, "ben affleck": 25, "bradley cooper": 25, "sylvester stallone": 25, "george clooney": 25, "kevin costner": 25, "ron howard": 25,
      "francis ford coppola": 45, "coppola": 45, "ridley scott": 45, "denis villeneuve": 45, "villeneuve": 45, "david fincher": 45, "fincher": 45, "hayao miyazaki": 45, "miyazaki": 45, "bong joon ho": 45, "alfonso cuaron": 45, "cuaron": 45, "luis buñuel": 45, "buñuel": 45, "carlos saura": 45, "saura": 45, "berlanga": 45, "luis garcia berlanga": 45, "sofia coppola": 45, "greta gerwig": 45, "kathryn bigelow": 45, "wes anderson": 45, "yorgos lanthimos": 45, "alejandro gonzalez iñarritu": 45, "iñarritu": 45, "lanthimos": 45, "david lynch": 45, "lynch": 45, "paul thomas anderson": 45, "hermanos coen": 45, "roman polanski": 45, "brian de palma": 45, "oliver stone": 45, "m night shyamalan": 45, "danny boyle": 45, "guy ritchie": 45, "damien chazelle": 45, "jordan peele": 45,
      "billy wilder": 65, "akira kurosawa": 65, "ingmar bergman": 65, "wilder": 65, "kurosawa": 65, "bergman": 65, "federico fellini": 65, "fellini": 65, "orson welles": 65, "welles": 65, "sergio leone": 65, "leone": 65, "john ford": 65, "howard hawks": 65, "frank capra": 65, "john huston": 65, "sidney lumet": 65, "milos forman": 65, "david cronenberg": 65, "john carpenter": 65, "george a romero": 65, "wim wenders": 65, "werner herzog": 65, "lars von trier": 65, "michael haneke": 65, "paolo sorrentino": 65, "luca guadagnino": 65, "ruben ostlund": 65,
      "andrei tarkovski": 85, "tarkovski": 85, "jean luc godard": 85, "godard": 85, "francois truffaut": 85, "truffaut": 85, "eric rohmer": 85, "claude chabrol": 85, "robert bresson": 85, "jean renoir": 85, "fritz lang": 85, "f w murnau": 85, "serguei eisenstein": 85, "vittorio de sica": 85, "luchino visconti": 85, "roberto rossellini": 85, "michelangelo antonioni": 85, "pier paolo pasolini": 85, "bernardo bertolucci": 85, "yasujiro ozu": 85,
      "segundo de chomon": 100, "chomon": 100, "apichatpong weerasethakul": 100, "bela tarr": 100, "chantal akerman": 100, "maya deren": 100, "jonas mekas": 100, "alejandro jodorowsky": 100, "sergei parajanov": 100, "otar iosseliani": 100, "theo angelopoulos": 100, "manoel de oliveira": 100, "lucrecia martel": 100, "florian rey": 100
    }
  },
  {
    id: "pel-006", dailyId: "dia8-02", pack: "peliculas",
    texto: "Película de terror, suspense psicológico o monstruos",
    ejemplo: "haxan",
    answers: {
      "el exorcista": 10, "exorcista": 10, "el resplandor": 10, "resplandor": 10, "expediente warren": 10, "it": 10, "scream": 10, "psicosis": 10, "saw": 10, "paranormal activity": 10, "rec": 10, "alien": 10, "insidious": 10, "the conjuring": 10, "eso": 10, "psycho": 10, "actividad paranormal": 10, "tiburon": 10, "el silencio de los corderos": 10, "silencio de los corderos": 10, "el sexto sentido": 10, "sexto sentido": 10,
      "scary movie": 25, "cazafantasmas": 25, "los cazafantasmas": 25, "la familia addams": 25, "familia addams": 25, "pesadilla antes de navidad": 25, "la novia cadaver": 25, "frankenweenie": 25, "hotel transilvania": 25, "coraline": 25, "los mundos de coraline": 25, "beetlejuice": 25, "bitelchus": 25, "gremlins": 25, "los gremlins": 25, "el retorno de las brujas": 25, "hocus pocus": 25, "casper": 25, "crepusculo": 25, "blade": 25,
      "la cosa": 45, "halloween": 45, "pesadilla en elm street": 45, "viernes 13": 45, "hereditary": 45, "midsommar": 45, "la bruja": 45, "el proyecto de la bruja de blair": 45, "the ring": 45, "la semilla del diablo": 45, "profecia": 45, "la profecia": 45, "poltergeist": 45, "el orfanato": 45, "los otros": 45, "tesis": 45, "babadook": 45, "sinister": 45, "the thing": 45, "la noche de halloween": 45, "la matanza de texas": 45, "matanza de texas": 45, "chucky": 45, "el muñeco diabolico": 45, "la señal": 45, "la maldicion": 45, "the grudge": 45, "bruja de blair": 45, "semilla del diablo": 45, "carrie": 45, "misery": 45, "la niebla": 45, "orfanato": 45, "the witch": 45, "un lugar tranquilo": 45, "dejame salir": 45, "get out": 45, "nosotros": 45,
      "candyman": 65, "hellraiser": 65, "suspiria": 65, "los pajaros": 65, "la ventana indiscreta": 65, "vertigo": 65, "el cabo del miedo": 65, "la noche de los muertos vivientes": 65, "el amanecer de los muertos": 65, "posesion infernal": 65, "evil dead": 65, "arrastrame al infierno": 65, "no respires": 65, "it follows": 65, "la cabaña en el bosque": 65, "la autopsia de jane doe": 65, "el exorcismo de emily rose": 65, "los extraños": 65, "la huerfana": 65, "el espinazo del diablo": 65, "el laberinto del fauno": 65, "los ojos de julia": 65, "mientras duermes": 65, "veronica": 65, "el dia de la bestia": 65, "el faro": 65, "the lighthouse": 65, "el hombre invisible": 65,
      "el hombre de mimbre": 85, "the wicker man": 85, "amenaza en la sombra": 85, "repulsion": 85, "el quimera": 85, "el inquilino": 85, "la escalera de jacob": 85, "el corazon del angel": 85, "al final de la escalera": 85, "el ente": 85, "phantasma": 85, "re animator": 85, "un hombre lobo americano en londres": 85, "aullidos": 85, "el fotografo del panico": 85, "los ojos sin rostro": 85, "las diabolicas": 85, "el gabinete del doctor caligari": 85, "nosferatu": 85, "la parada de los monstruos": 85,
      "haxan": 100, "vampyr": 100, "el golem": 100, "las manos de orlac": 100, "el hombre que rie": 100, "kuroneko": 100, "onibaba": 100, "kwaidan": 100, "hausu": 100, "tetsuo": 100, "begotten": 100, "eraserhead": 100, "cabeza borradora": 100, "santa sangre": 100
    }
  },
  {
    id: "pel-007", dailyId: "dia9-02", pack: "peliculas",
    texto: "Película o saga de acción, superhéroes, agentes secretos o atracos",
    ejemplo: "rififi",
    answers: {
      "james bond": 10, "007": 10, "mision imposible": 10, "batman": 10, "spiderman": 10, "spider man": 10, "los vengadores": 10, "vengadores": 10, "avengers": 10, "iron man": 10, "matrix": 10, "the matrix": 10, "fast and furious": 10, "a todo gas": 10, "john wick": 10, "ocean eleven": 10, "oceans eleven": 10, "la jungla de cristal": 10, "jungla de cristal": 10, "die hard": 10, "el caballero oscuro": 10, "caballero oscuro": 10,
      "superman": 25, "thor": 25, "capitan america": 25, "hulk": 25, "black panther": 25, "guardianes de la galaxia": 25, "wonder woman": 25, "aquaman": 25, "escuadron suicida": 25, "liga de la justicia": 25, "x men": 25, "lobezno": 25, "wolverine": 25, "deadpool": 25, "the batman": 25, "joker": 25, "venom": 25, "ant man": 25, "doctor strange": 25, "capitana marvel": 25,
      "terminator": 45, "terminator 2": 45, "rambo": 45, "john rambo": 45, "acero puro": 45, "depredador": 45, "predator": 45, "robocop": 45, "heat": 45, "speed": 45, "bourne": 45, "el caso bourne": 45, "casino royale": 45, "skyfall": 45, "spectre": 45, "goldfinger": 45, "top gun": 45, "top gun maverick": 45, "mad max": 45, "mad max fury road": 45, "mad max furia en la carretera": 45, "kick ass": 45, "kingsman": 45, "el fuego de la venganza": 45, "sicario": 45, "arma letal": 45, "taken": 45, "venganza": 45, "baby driver": 45, "the punisher": 45, "punisher": 45, "kill bill": 45, "gladiator": 45, "300": 45, "troya": 45, "indiana jones": 45, "piratas del caribe": 45, "los mercenarios": 45,
      "el pacificador": 65, "ronin": 65, "ronan": 65, "italian job": 65, "the italian job": 65, "ciudad de ladrones": 65, "the town": 65, "plan oculto": 65, "inside man": 65, "point break": 65, "le llaman bodhi": 65, "con air": 65, "la roca": 65, "the rock": 65, "cara a cara": 65, "face off": 65, "demolition man": 65, "ultimo gran heroe": 65, "desafio total": 65, "total recall": 65, "mentiras arriesgadas": 65, "true lies": 65, "blanco humano": 65, "soldado universal": 65, "timecop": 65, "alerta maxima": 65, "contacto sangriento": 65, "operacion dragon": 65,
      "el profesional": 85, "leon el profesional": 85, "leon": 85, "nikita": 85, "atomic blonde": 85, "atomica": 85, "nobody": 85, "nadie": 85, "the raid": 85, "redada asesina": 85, "oldboy": 85, "hard boiled": 85, "the killer": 85, "a better tomorrow": 85, "tigre y dragon": 85, "hero": 85, "la casa de las dagas voladoras": 85, "ip man": 85, "ong bak": 85, "dredd": 85,
      "rififi": 100, "circulo rojo": 100, "le cercle rouge": 100, "el silencio de un hombre": 100, "le samourai": 100, "atraco perfecto": 100, "the killing": 100, "jungla de asfalto": 100, "the getaway": 100, "la huida": 100, "bullitt": 100, "pelham 1 2 3": 100, "asalto a la comisaria del distrito 13": 100, "to live and die in la": 100
    }
  },
  /* ----- Dossier Películas · Capítulo 2: Cine Nacional, Comedia e Industria ----- */
  {
    id: "pel-008", dailyId: "dia10-01", pack: "peliculas",
    texto: "Película española histórica o contemporánea",
    ejemplo: "el verdugo",
    answers: {
      "torrente": 10, "torrente el brazo tonto de la ley": 10, "el brazo tonto de la ley": 10, "torrente 2": 10, "torrente 2 mision en marbella": 10,
      "mision en marbella": 10, "torrente 3": 10, "torrente 4": 10, "torrente 5": 10, "ocho apellidos vascos": 10,
      "8 apellidos vascos": 10, "ocho apellidos catalanes": 10, "8 apellidos catalanes": 10, "lo imposible": 10, "mar adentro": 10,
      "la isla minima": 10, "isla minima": 10, "el laberinto del fauno": 10, "laberinto del fauno": 10, "celda 211": 10,
      "tesis": 10, "campeones": 10, "los otros": 10, "el orfanato": 10, "orfanato": 10,
      "mujeres al borde de un ataque de nervios": 10, "la sociedad de la nieve": 10, "sociedad de la nieve": 10, "padre no hay mas que uno": 10, "abre los ojos": 25,
      "todo sobre mi madre": 25, "volver": 25, "alcarras": 25, "as bestas": 25, "el dia de la bestia": 25,
      "dia de la bestia": 25, "airbag": 25, "el milagro de p tinto": 25, "el milagro de p. tinto": 25, "milagro de p tinto": 25,
      "viridiana": 25, "bienvenido mister marshall": 25, "bienvenido mr marshall": 25, "los santos inocentes": 25, "santos inocentes": 25,
      "la lengua de las mariposas": 25, "lengua de las mariposas": 25, "solas": 25, "madres paralelas": 25, "dolor y gloria": 25,
      "el hoyo": 25, "hoyo": 25, "modelo 77": 25, "quien a hierro mata": 25, "spanish movie": 25,
      "rec": 25, "[rec]": 25, "rec 2": 25, "padrenuestro": 25, "mortadelo y filemon": 25,
      "la gran aventura de mortadelo y filemon": 25, "hable con ella": 25, "los abrazos rotos": 25, "la mala educacion": 25, "la piel que habito": 25,
      "el verdugo": 45, "verdugo": 45, "muerte de un ciclista": 45, "el espiritu de la colmena": 45, "espiritu de la colmena": 45,
      "el sur": 45, "la vaquilla": 45, "vaquilla": 45, "jamon jamon": 45, "libertarias": 45,
      "amores perros": 45, "el bola": 45, "bola": 45, "smoking room": 45, "te doy mis ojos": 45,
      "7 virgenes": 45, "siete virgenes": 45, "grupo 7": 45, "la voz dormida": 45, "canibal": 45,
      "verano 1993": 45, "las niñas": 45, "la trinchera infinita": 45, "trinchera infinita": 45, "tarde para la ira": 45,
      "carmina o revienta": 45, "carmina y amen": 45, "barrio": 45, "los lunes al sol": 45, "lunes al sol": 45,
      "crimen ferpecto": 45, "que dios nos perdone": 45, "animales sin collar": 45, "las brujas de zugarramurdi": 45, "brujas de zugarramurdi": 45,
      "la ardilla roja": 45, "ardilla roja": 45, "amantes": 45, "relatos salvajes": 45, "blancanieves": 45,
      "vivir es facil con los ojos cerrados": 45, "intacto": 55, "el secreto de sus ojos": 55, "la habitacion de fermat": 55, "el desconocido": 55,
      "el reino": 65, "reino": 65, "accion mutante": 65, "los cronocrimenes": 65, "cronocrimenes": 65,
      "la comunidad": 65, "comunidad": 65, "nadie conoce a nadie": 65, "lucia y el sexo": 65, "el alquimista impaciente": 65,
      "la caja 507": 65, "caja 507": 65, "arrebato": 85, "arrebatos": 85, "bilbao": 85,
      "caniche": 85, "opera prima": 85, "la colmena": 85, "los amantes del circulo polar": 85, "amantes del circulo polar": 85,
      "tierra": 85, "cria cuervos": 85, "la escopeta nacional": 85, "escopeta nacional": 85, "patrimonio nacional": 85,
      "nacional iii": 85, "nacional 3": 85, "beltenebros": 85, "el viaje a ninguna parte": 85, "viaje a ninguna parte": 85,
      "funcion de noche": 85, "el desencanto": 85, "desencanto": 85, "tras el cristal": 85, "amador": 85,
      "alas de mariposa": 85, "el rey pasmado": 85, "rey pasmado": 85, "la aguja": 85, "demonios en el jardin": 85,
      "entre tinieblas": 85, "que he hecho yo para merecer esto": 85, "la flor de mi secreto": 85, "matador": 85, "atame": 85,
      "tacones lejanos": 85, "pepi luci bom y otras chicas del monton": 85, "laberinto de pasiones": 85, "kika": 85, "historias del kronen": 85,
      "dias contados": 85, "el crack": 85, "el crack 2": 85, "el crack cero": 85, "deprisa deprisa": 85,
      "perros callejeros": 85, "navajeros": 85, "el pico": 85, "el pico 2": 85, "colegas": 85,
      "la torre de los siete jorobados": 100, "torre de los siete jorobados": 100, "vida en sombras": 100, "cielo negro": 100, "el extraño viaje": 100,
      "extraño viaje": 100, "surcos": 100, "placido": 100, "si te dicen que cai": 100, "el bosque animado": 100,
      "bosque animado": 100, "la marrana": 100, "amanece que no es poco": 100, "asfixia": 100, "las truchas": 100,
      "truchas": 100, "furtivos": 100, "la tia tula": 100, "tia tula": 100, "el anacoreta": 100,
      "anacoreta": 100, "la caza": 100, "ana y los lobos": 100, "mama cumple cien años": 100, "el caso almeria": 100,
      "caso almeria": 100, "siete dias de enero": 100, "7 dias de enero": 100, "la teta y la luna": 100, "teta y la luna": 100,
      "taxi": 100, "taxi saura": 100, "sevilla connection": 100, "rojo y negro": 100, "apartado de correos 1001": 100,
      "distrito quinto": 100, "brigada criminal": 100, "los peces rojos": 100, "calle mayor": 100, "el cebo": 100,
      "nadarin": 100, "el sol del membrillo": 100, "tren de sombras": 100, "innisfree": 100, "dias viejos": 100,
      "ditirambo": 100
    }
  },
  {
    id: "pel-009", dailyId: "dia10-06", pack: "peliculas",
    texto: "Actor o actriz del cine español",
    ejemplo: "antonio banderas",
    answers: {
      "antonio banderas": 10, "banderas": 10, "javier bardem": 10, "bardem": 10, "penelope cruz": 10,
      "mario casas": 10, "santiago segura": 10, "paco leon": 10, "blanca suarez": 10, "ursula corbero": 10,
      "jose coronado": 10, "coronado": 10, "luis tosar": 10, "tosar": 10, "eduard fernandez": 25,
      "antonio de la torre": 25, "raul arevalo": 25, "javier camara": 25, "carmen maura": 25, "maribel verdu": 25,
      "paz vega": 25, "elsa pataky": 25, "clara lago": 25, "dani rovira": 25, "hugo silva": 25,
      "miguel angel silvestre": 25, "quim gutierrez": 25, "karra elejalde": 25, "javier gutierrez": 25, "roberto alamo": 25,
      "macarena garcia": 25, "anna castillo": 25, "alex gonzalez": 25, "blanca portillo": 25, "luis zahera": 25,
      "zahera": 25, "inma cuesta": 25, "fernando fernan gomez": 45, "fernan gomez": 45, "alfredo landa": 45,
      "landa": 45, "paco martinez soria": 45, "martinez soria": 45, "jose luis lopez vazquez": 45, "lopez vazquez": 45,
      "concha velasco": 45, "lola flores": 45, "sara montiel": 45, "victoria abril": 45, "angela molina": 45,
      "candela peña": 45, "lola dueñas": 45, "emma suarez": 45, "najwa nimri": 45, "alvaro morte": 45,
      "pedro alonso": 45, "jaime lorente": 45, "enric auquer": 45, "david verdaguer": 45, "manolo solo": 45,
      "pere ponce": 45, "sergi lopez": 45, "tristan ulloa": 45, "unax ugalde": 45, "leonor watling": 45,
      "belen rueda": 45, "barbara lennie": 45, "aida folch": 45, "adriana ugarte": 45, "veronica echegui": 45,
      "natalia de molina": 45, "resines": 55, "antonio resines": 55, "juan diego botto": 55, "carlos areces": 55,
      "ernesto alterio": 55, "malena alterio": 55, "maria galiana": 65, "pepe viyuela": 65, "javier rey": 65,
      "miren ibarguren": 65, "pepe isbert": 85, "isbert": 85, "manolo moran": 85, "alberto closas": 85,
      "analia gade": 85, "amparo rivelles": 85, "aurora bautista": 85, "rafaela aparicio": 85, "florinda chico": 85,
      "juanjo puigcorbe": 85, "juan diego": 85, "imanol arias": 85, "juan echanove": 85, "emilio gutierrez caba": 85,
      "julia gutierrez caba": 85, "terele pavez": 85, "chus lampreave": 85, "rossy de palma": 85, "bibiana fernandez": 85,
      "loles leon": 85, "maria barranco": 85, "kiti manver": 85, "carmen machi": 85, "jorge sanz": 85,
      "gabino diego": 85, "alex angulo": 85, "santiago ramos": 85, "fele martinez": 85, "gracia olayo": 85,
      "soledad villamil": 85, "miguel rellan": 85, "tito valverde": 85, "sancho gracia": 85, "jose sacristan": 85,
      "sacristan": 85, "josema yuste": 85, "millan salcedo": 85, "alberto san juan": 100, "alicia hermida": 100,
      "alvaro de luna": 100, "fernando rey": 100, "francisco rabal": 100, "paco rabal": 100, "carlos larrañaga": 100,
      "adolfo marsillach": 100, "amparo soler leal": 100, "maria luisa ponte": 100, "margot cottens": 100, "luis ciges": 100,
      "ciges": 100, "manuel alexandre": 100, "agustin gonzalez": 100, "jose bodalo": 100, "antonio ferrandis": 100,
      "carmen sevilla": 100, "joselito": 100, "marisol": 100, "pepa flores": 100, "charo lopez": 100,
      "assumpta serna": 100, "silvia munt": 100, "iciar bollain": 100, "aitana sanchez-gijon": 100, "aitana sanchez gijon": 100,
      "monica cervera": 100, "oscar jaenada": 100, "alberto amarilla": 100, "emma penella": 100, "gemma cuervo": 100,
      "marisa paredes": 100, "eusebio poncela": 100, "julian mateos": 100, "arturo fernandez": 100, "rafael alonso": 100,
      "mary carrillo": 100, "elena anaya": 100, "laia marull": 100, "pilar lopez de ayala": 100, "silvia abascal": 100,
      "cuca escribano": 100, "ana torrent": 100, "maribel marin": 100, "pedro mari sanchez": 100, "jose maria rodero": 100
    }
  },
  {
    id: "pel-010", dailyId: "dia11-03", pack: "peliculas",
    texto: "Película de comedia (nacional o internacional)",
    ejemplo: "aterriza como puedas",
    answers: {}
  },
  {
    id: "pel-011", dailyId: "dia12-07", pack: "peliculas",
    texto: "Película bélica, de guerra o conflicto militar",
    ejemplo: "salvar al soldado ryan",
    answers: {}
  },
  {
    id: "pel-012", dailyId: "dia13-06", pack: "peliculas",
    texto: "Saga cinematográfica de al menos tres entregas",
    ejemplo: "el padrino",
    answers: {}
  },
  {
    id: "pel-013", dailyId: "dia13-02", pack: "peliculas",
    texto: "Actor o actriz clásico de la época dorada de Hollywood",
    ejemplo: "humphrey bogart",
    answers: {}
  },
  {
    id: "pel-014", dailyId: "dia14-04", pack: "peliculas",
    texto: "Película de animación NO producida por Disney ni Pixar (Ghibli, DreamWorks, etc.)",
    ejemplo: "el viaje de chihiro",
    answers: {
      /* 10 pts - Éxitos comerciales masivos globales */
      "shrek": 10, "shrek 2": 10, "shrek tercero": 10, "shrek 3": 10,
      "madagascar": 10, "madagascar 2": 10, "kung fu panda": 10, "kung fu panda 2": 10,
      "ice age": 10, "ice age 2": 10, "la era de hielo": 10, "minions": 10,
      "los minions": 10, "gru mi villano favorito": 10, "mi villano favorito": 10, "como entrenar a tu dragon": 10,
      "como entrenar a tu dragon 2": 10, "el viaje de chihiro": 10,
      /* 25 pts - Blockbusters conocidos, DreamWorks/Illumination/Sony y clásicos Studio Ghibli */
      "spider-man un nuevo universo": 25, "spiderman un nuevo universo": 25, "spider-man cruzando el multiverso": 25, "spiderman cruzando el multiverso": 25,
      "spider-verse": 25, "el gato con botas": 25, "el gato con botas el ultimo deseo": 25, "mi vecino totoro": 25,
      "totoro": 25, "la princesa mononoke": 25, "el castillo ambulante": 25, "coraline": 25,
      "los mundos de coraline": 25, "la novia cadaver": 25, "pesadilla antes de navidad": 25, "rio": 25,
      "hotel transilvania": 25, "hotel transylvania": 25, "spirit": 25, "spirit el corcel indomable": 25,
      "el principe de egipto": 25, "el gigante de hierro": 25, "your name": 25, "kimi no na wa": 25,
      "akira": 25, "megamind": 25, "canta": 25, "mascotas": 25,
      "los croods": 25, "el espantatiburones": 25,
      /* 45 pts - Animación europea, clásicos Ghibli y stop-motion */
      "la tumba de las luciernagas": 45, "ponyo": 45, "ponyo en el acantilado": 45, "nausicaa": 45,
      "nausicaa del valle del viento": 45, "porco rosso": 45, "el viento se levanta": 45, "el niño y la garza": 45,
      "ghost in the shell": 45, "paprika": 45, "perfect blue": 45, "el tiempo contigo": 45,
      "suzume": 45, "klaus": 45, "arrugas": 45, "mortadelo y filemon contra jimmy el cachondo": 45,
      "las aventuras de tadeo jones": 45, "tadeo jones": 45, "planet 51": 45, "chico y rita": 45,
      "wallace y gromit": 45, "rebelion en la granja": 45, "pollitos en fuga": 45, "chicken run": 45,
      "fantastico sr fox": 45, "isla de perros": 45, "persepolis": 45,
      /* 65 pts - Anime cinematográfico popular y cine de autor */
      "jujutsu kaisen 0": 65, "demon slayer tren infinito": 65, "one piece film red": 65, "el ilusionista": 65,
      "vals con bashir": 65, "la cancion del mar": 65, "wolfwalkers": 65, "chicos y mendez": 65,
      "una voz silenciosa": 65, "la chica que saltaba a traves del tiempo": 65, "el niño y la bestia": 65, "summer wars": 65,
      "belle": 65,
      /* 85 pts - Cine de culto, franquicias de animación y joyas de autor */
      "neon genesis evangelion the end of evangelion": 85, "the end of evangelion": 85, "evangelion 3.0+1.0": 85, "evangelion": 85,
      "dragon ball super broly": 85, "dragon ball z el ataque del dragon": 85, "el castillo de cagliostro": 85, "belladonna of sadness": 85,
      "la tortuga roja": 85, "robot dreams": 85, "buñuel en el laberinto de las tortugas": 85, "el secreto del libro de kells": 85,
      "ernest y celestine": 85, "la vida de calabacin": 85, "mary and max": 85, "millenium actress": 85,
      "tokyo godfathers": 85, "el planeta salvaje": 85, "la colina de las amapolas": 85, "marnie": 85,
      "recuerdos del ayer": 85, "puedo escuchar el mar": 85, "mis vecinos los yamada": 85, "cartas para mormo": 85,
      "ninja scroll": 85, "sword of the stranger": 85, "flee": 85,
      /* 100 pts - AGENTE DURMIENTE / Nicho extremo, cine independiente y vanguardia */
      "angel's egg": 100, "tenshi no tamago": 100, "mind game": 100, "night is short walk on girl": 100,
      "it's such a beautiful day": 100, "tekkonkinkreet": 100, "jin-roh": 100, "metropolis": 100,
      "genius party": 100, "redline": 100, "memory": 100, "memories": 100,
      "royal space force": 100, "la casa lobo": 100, "mad god": 100, "memoria de un caracol": 100,
      "crisalida": 100, "el bosque animado": 100, "la leyenda del unicornio": 100, "nocturna": 100,
      "don quijote de la mancha": 100, "animales unidos": 100, "tamala 2010": 100, "patlabor": 100,
      "marona's fantastic tale": 100
    }
  },

  /* ----- Dossier Películas · Capítulo 3: Cine de Autor y Mitología Cinematográfica ----- */
  {
    id: "pel-015", dailyId: "dia15-04", pack: "peliculas",
    texto: "Película ganadora del Premio Goya a Mejor Película",
    ejemplo: "tesis",
    answers: {}
  },
  {
    id: "pel-016", dailyId: "dia15-02", pack: "peliculas",
    texto: "Personaje de villano o antagonista icónico del cine",
    ejemplo: "darth vader",
    answers: {}
  },
  {
    id: "pel-017", dailyId: "dia16-05", pack: "peliculas",
    texto: "Película de género Western (del oeste o spaguetti western)",
    ejemplo: "el bueno el feo y el malo",
    answers: {}
  },
  {
    id: "pel-018", dailyId: "dia17-03", pack: "peliculas",
    texto: "Película basada en hechos reales, biopic o acontecimiento histórico",
    ejemplo: "la lista de schindler",
    answers: {}
  },
  {
    id: "pel-019", dailyId: "dia17-06", pack: "peliculas",
    texto: "Película musical o con temática centrada en la música",
    ejemplo: "cantando bajo la lluvia",
    answers: {}
  },
  {
    id: "pel-020", dailyId: "dia18-01", pack: "peliculas",
    texto: "Compositor legendario de bandas sonoras de cine",
    ejemplo: "ennio morricone",
    answers: {}
  },
  {
    id: "pel-021", dailyId: "dia19-04", pack: "peliculas",
    texto: "Película policiaca, de detectives, cine negro o mafia",
    ejemplo: "uno de los nuestros",
    answers: {}
  },
  {
    id: "dep-001", dailyId: "dia5-04", pack: "deportes",
    texto: "Deporte que se juegue con red",
    ejemplo: "jianzi",
    answers: {
      "tenis": 10, "voleibol": 10, "voley": 10, "volei": 10,
      "padel": 25, "badminton": 25, "ping pong": 25, "tenis de mesa": 25, "futbol": 25, "baloncesto": 25, "basket": 25,
      "balonmano": 25, "waterpolo": 25, "hockey": 25, "futbol sala": 25, "futsal": 25, "hockey sobre hielo": 25, "hockey hielo": 25,
      "hockey hierba": 25, "hockey sobre hierba": 25, "hockey patines": 25, "hockey sobre patines": 25, "pesca": 25, "pesca deportiva": 25, "pesca con caña": 25,
      "pingpong": 25, "pin pon": 25,
      "volei playa": 45, "voley playa": 45, "voleibol playa": 45, "voleibol de playa": 45, "beach voley": 45, "tenis playa": 45, "tenis de playa": 45,
      "beach tennis": 45, "pickleball": 45, "futvoley": 45, "futvolei": 45, "footvolley": 45, "futbol tenis": 45, "futtenis": 45,
      "frontenis": 45, "tenis en silla de ruedas": 45, "tenis silla de ruedas": 45, "voleibol sentado": 45, "minitenis": 45, "mini tenis": 45, "minivoley": 45,
      "tenis individual": 45, "tenis dobles": 45, "lacrosse": 45, "futbol playa": 45, "balonmano playa": 45, "baloncesto 3x3": 45, "basket 3x3": 45,
      "polo": 45, "hockey linea": 45, "hockey en linea": 45, "padbol": 45, "teqball": 45, "netball": 45,
      "badminton adaptado": 65, "parabadminton": 65, "para badminton": 65, "paratenis de mesa": 65, "tenis de mesa adaptado": 65, "tenis adaptado": 65, "padel en silla de ruedas": 65,
      "padel adaptado": 65, "touchtennis": 65, "touch tennis": 65, "soft tennis": 65, "tenis blando": 65, "speed badminton": 65, "crossminton": 65,
      "indiaca": 65, "peteca": 65, "fistball": 65, "faustball": 65, "punhobol": 65, "puñobol": 65, "squash tennis": 65,
      "korfball": 65, "korfbal": 65, "balonkorf": 65, "floorball": 65, "unihockey": 65, "kayak polo": 65, "piragua polo": 65,
      "tchoukball": 65, "wallyball": 65, "ecuavoley": 65, "cachibol": 65, "newcomb": 65, "voley nieve": 65, "voleibol de nieve": 65,
      "sepak takraw": 85, "takraw": 85, "bossaball": 85, "roundnet": 85, "spikeball": 85, "jeu de paume": 85, "real tennis": 85,
      "tenis real": 85, "xare": 85, "share": 85, "teqvoly": 85, "teqis": 85, "teqpong": 85, "padel playa": 85,
      "jorkyball": 85, "headis": 85, "air badminton": 85, "airbadminton": 85, "tenis para ciegos": 85, "mintonette": 85, "hooverball": 85,
      "biribol": 85, "acuavoley": 85, "voleibol acuatico": 85, "footbag net": 85, "jokgu": 85, "bandy": 85, "ringette": 85,
      "hockey subacuatico": 85, "bikepolo": 85, "ciclopolo": 85, "cestoball": 85,
      "jianzi": 100, "pluma": 100, "shuttlecock": 100, "battledore": 100, "qianball": 100, "speed ball": 100, "prellball": 100,
      "throwball": 100, "ball badminton": 100, "sipa": 100, "chinlone": 100, "ringtennis": 100, "tennikoit": 100, "deck tennis": 100,
      "featherball": 100
    }
  },
  {
    id: "dep-002", dailyId: "dia5-07", pack: "deportes",
    texto: "Club de fútbol histórico o actual de España (Primera o Segunda División)",
    ejemplo: "arenas de getxo",
    answers: {
      "real madrid": 10, "barcelona": 10, "barca": 10, "atletico de madrid": 10, "sevilla": 10, "real betis": 10, "betis": 10, "valencia": 10, "athletic club": 10, "athletic de bilbao": 10, "real sociedad": 10, "villarreal": 10, "celta": 10, "madrid": 10, "fc barcelona": 10, "atletico": 10, "atleti": 10, "sevilla fc": 10, "valencia cf": 10, "athletic": 10, "celta de vigo": 10, "rcd espanyol": 10,
      "seleccion española": 25, "españa": 25, "la roja": 25, "real madrid castilla": 25, "castilla": 25, "barca atletic": 25, "barcelona b": 25, "porcinos": 25, "troncos": 25, "ultimate mostoles": 25, "saiyans": 25, "jijantes": 25, "xbuyer team": 25, "pio fc": 25, "kunisports": 25, "el barrio": 25, "1k": 25, "aniquiladores": 25, "rayo de barcelona": 25, "inter de madrid": 25,
      "deportivo de la coruña": 45, "zaragoza": 45, "sporting de gijon": 45, "oviedo": 45, "malaga": 45, "cadiz": 45, "granada": 45, "almeria": 45, "cordoba": 45, "tenerife": 45, "las palmas": 45, "osasuna": 45, "mallorca": 45, "rayo vallecano": 45, "getafe": 45, "leganes": 45, "eibar": 45, "alaves": 45, "valladolid": 45, "racing de santander": 45, "elche": 45, "deportivo": 45, "depor": 45, "real zaragoza": 45, "sporting": 45, "real oviedo": 45, "malaga cf": 45, "cadiz cf": 45, "granada cf": 45, "ud almeria": 45, "cordoba cf": 45, "cd tenerife": 45, "ud las palmas": 45, "ca osasuna": 45, "rcd mallorca": 45, "rayo": 45, "getafe cf": 45, "cd leganes": 45,
      "recreativo de huelva": 65, "xerez": 65, "numancia": 65, "albacete": 65, "murcia": 65, "real murcia": 65, "hercules": 65, "castellon": 65, "recreativo": 65, "recre": 65, "xerez cd": 65, "cd numancia": 65, "albacete balompie": 65, "hercules cf": 65, "cd castellon": 65, "burgos": 65, "burgos cf": 65, "mirandes": 65, "cd mirandes": 65, "huesca": 65, "sd huesca": 65, "cartagena": 65, "fc cartagena": 65, "racing de ferrol": 65, "ferrol": 65, "eldense": 65, "cd eldense": 65, "alcorcon": 65, "jaen": 65, "real jaen cf": 65,
      "pontevedra": 85, "alcoyano": 85, "compostela": 85, "extremadura": 85, "merida": 85, "salamanca": 85, "logroñes": 85, "pontevedra cf": 85, "ud salamanca": 85, "cd logroñes": 85, "ud logroñes": 85, "sd compostela": 85, "cf extremadura": 85, "cp merida": 85, "cd alcoyano": 85, "sabadel": 85, "ce sabadell": 85, "cultural leonesa": 85, "real jaen": 85, "linares": 85,
      "arenas de getxo": 100, "real union": 100, "arenas club": 100, "real union de irun": 100, "europa": 100, "ce europa": 100, "atletico tetuan": 100, "condal": 100, "cd condal": 100, "ad almeria": 100, "espanya de barcelona": 100, "iberia sc": 100, "racing de madrid": 100, "español de madrid": 100
    }
  },
  {
    id: "dep-003", dailyId: "dia6-04", pack: "deportes",
    texto: "Disciplina, modalidad o prueba oficial de los Juegos Olímpicos",
    ejemplo: "sokatira",
    answers: {
      "atletismo": 10, "natacion": 10, "futbol": 10, "baloncesto": 10, "tenis": 10, "gimnasia": 10, "ciclismo": 10, "boxeo": 10, "esgrima": 10, "tiro con arco": 10, "taekwondo": 10, "judo": 10, "halterofilia": 10, "piraguismo": 10, "remo": 10, "vela": 10, "waterpolo": 10, "triatlon": 10, "gimnasia artistica": 10, "voleibol": 10, "balonmano": 10, "badminton": 10,
      "cien metros": 25, "100 metros": 25, "relevos": 25, "correr": 25, "nadar": 25, "bicicleta": 25, "pesas": 25, "caballos": 25, "hipica": 25, "golf": 25, "surf": 25, "skate": 25, "monopatin": 25, "escalar": 25, "baile": 25, "arco": 25, "tiro": 25, "lucha": 25, "karate": 25, "rugby": 25,
      "cien metros lisos": 45, "maraton": 45, "salto con pertiga": 45, "lanzamiento de jabalina": 45, "lanzamiento de martillo": 45, "decathlon": 45, "heptathlon": 45, "marcha atletica": 45, "natacion sincronizada": 45, "salto de trampolin": 45, "escalada": 45, "skateboarding": 45, "breakdance": 45, "hockey sobre hielo": 45, "100 metros lisos": 45, "salto de longitud": 45, "salto de altura": 45, "triple salto": 45, "lanzamiento de peso": 45, "lanzamiento de disco": 45, "decatlon": 45, "heptatlon": 45, "natacion artistica": 45, "saltos de trampolin": 45, "gimnasia ritmica": 45, "gimnasia en trampolin": 45, "ciclismo en pista": 45, "ciclismo en ruta": 45, "ciclismo de montaña": 45, "bmx": 45, "voley playa": 45, "voleibol de playa": 45, "baloncesto 3x3": 45, "rugby 7": 45, "rugby a siete": 45, "escalada deportiva": 45, "breaking": 45, "hockey sobre hierba": 45,
      "pentatlon moderno": 65, "curling": 65, "biatlon": 65, "bobsleigh": 65, "luge": 65, "skeleton": 65, "salto de esqui": 65, "patinaje de velocidad": 65, "aguas abiertas": 65, "piraguismo en eslalon": 65, "eslalon": 65, "piraguismo en aguas bravas": 65, "lucha libre": 65, "lucha grecorromana": 65, "tiro olimpico": 65, "tiro al plato": 65, "doma clasica": 65, "salto ecuestre": 65, "concurso completo": 65, "20 kilometros marcha": 65, "50 kilometros marcha": 65, "3000 metros obstaculos": 65, "110 metros vallas": 65, "400 metros vallas": 65, "relevo 4x100": 65, "relevo 4x400": 65, "esqui alpino": 65, "esqui de fondo": 65,
      "combinada nordica": 85, "patinaje de velocidad en pista corta": 85, "short track": 85, "esqui de montaña": 85, "keirin": 85, "omnium": 85, "madison": 85, "persecucion por equipos": 85, "velocidad por equipos": 85, "espada": 85, "florete": 85, "sable": 85, "foso olimpico": 85, "skeet": 85, "pistola de aire": 85, "carabina": 85, "dos sin timonel": 85, "ocho con timonel": 85, "scull": 85, "nacra 17": 85,
      "sokatira": 100, "jeu de paume": 100, "roque": 100, "lacrosse": 100, "polo": 100, "tirar de la cuerda": 100, "pelota vasca": 100, "motonautica": 100, "croquet": 100, "tiro al pichon": 100, "salto sin impulso": 100, "patrulla militar": 100, "pentatlon de invierno": 100, "alpinismo": 100
    }
  },
  {
    id: "dep-004", dailyId: "dia7-06", pack: "deportes",
    texto: "Deportista español de élite (en activo o retirado)",
    ejemplo: "jose de amezola",
    answers: {
      "rafa nadal": 10, "nadal": 10, "pau gasol": 10, "gasol": 10, "fernando alonso": 10, "carlos alcaraz": 10, "marc marquez": 10, "andres iniesta": 10, "iker casillas": 10, "carlos sainz": 10, "miguel indurain": 10, "carolina marin": 10, "mireia belmonte": 10, "aitana bonmati": 10, "alexia putellas": 10, "rafael nadal": 10, "alonso": 10, "alcaraz": 10, "marquez": 10, "iniesta": 10, "casillas": 10, "sainz": 10,
      "raul gonzalez": 25, "xavi hernandez": 25, "carles puyol": 25, "sergio ramos": 25, "rodri": 25, "raul": 25, "xavi": 25, "puyol": 25, "ramos": 25, "pique": 25, "gerard pique": 25, "david villa": 25, "villa": 25, "fernando torres": 25, "torres": 25, "busquets": 25, "pedri": 25, "lamine yamal": 25, "yamal": 25, "rodrigo hernandez": 25,
      "severiano ballesteros": 45, "angel nieto": 45, "lydia valentin": 45, "saul craviotto": 45, "david cal": 45, "gervasio deferr": 45, "alberto contador": 45, "alejandro valverde": 45, "perico delgado": 45, "bahamontes": 45, "santana": 45, "arantxa sanchez vicario": 45, "conchita martinez": 45, "garbiñe muguruza": 45, "ricky rubio": 45, "marc gasol": 45, "navarro": 45, "ana peleteiro": 45, "jordan diaz": 45, "seve ballesteros": 45, "ballesteros": 45, "craviotto": 45, "deferr": 45, "contador": 45, "valverde": 45, "pedro delgado": 45, "federico martin bahamontes": 45, "manolo santana": 45, "sanchez vicario": 45, "muguruza": 45, "juan carlos navarro": 45, "peleteiro": 45, "jon rahm": 45, "rahm": 45, "sergio garcia": 45, "jose maria olazabal": 45, "olazabal": 45, "alex criville": 45,
      "blanca fernandez ochoa": 65, "paquito fernandez ochoa": 65, "oscar freire": 65, "kilian jornet": 65, "toni bou": 65, "laia sanz": 65, "fernandez ochoa": 65, "freire": 65, "carlos sastre": 65, "samuel sanchez": 65, "purito rodriguez": 65, "joaquin rodriguez": 65, "abraham olano": 65, "olano": 65, "luis ocaña": 65, "ocaña": 65, "juan carlos ferrero": 65, "ferrero": 65, "carlos moya": 65, "moya": 65, "david ferrer": 65, "alex corretja": 65, "sergi bruguera": 65, "manuel orantes": 65, "paula badosa": 65, "fernando romay": 65, "fernando martin": 65, "jorge garbajosa": 65,
      "fermin cacho": 85, "cacho": 85, "abel anton": 85, "martin fiz": 85, "marta dominguez": 85, "ruth beitia": 85, "beitia": 85, "orlando ortega": 85, "jesus angel garcia bragado": 85, "garcia bragado": 85, "joan llaneras": 85, "llaneras": 85, "jose manuel moreno": 85, "leire olanria": 85, "ander elosegi": 85, "maialen chourraut": 85, "chourraut": 85, "marcus cooper": 85, "cristian toro": 85, "teresa portela": 85,
      "jose de amezola": 100, "amezola": 100, "francisco villota": 100, "villota": 100, "pedro pidal": 100, "marques de villaviciosa": 100, "joaquin blume": 100, "blume": 100, "mariano haro": 100, "carmen valero": 100, "jordi llopart": 100, "llopart": 100, "josep marin": 100, "daniel plaza": 100
    }
  },
  {
    id: "dep-005", dailyId: "dia8-06", pack: "deportes",
    texto: "Término reglamentario, posición táctica, golpe o infracción deportiva",
    ejemplo: "gran willy",
    answers: {
      "fuera de juego": 10, "penalti": 10, "corner": 10, "saque de esquina": 10, "falta": 10, "tarjeta roja": 10, "tarjeta amarilla": 10, "gol": 10, "triple": 10, "tiro libre": 10, "mate": 10, "rebote": 10, "portero": 10, "delantero": 10, "centrocampista": 10, "defensa": 10, "penalty": 10, "roja": 10, "amarilla": 10, "canasta": 10, "saque": 10, "punto": 10,
      "arbitro": 25, "balon": 25, "pelota": 25, "raqueta": 25, "red": 25, "porteria": 25, "cancha": 25, "campo": 25, "estadio": 25, "banquillo": 25, "entrenador": 25, "jugador": 25, "equipo": 25, "camiseta": 25, "botas": 25, "silbato": 25, "cronometro": 25, "marcador": 25, "prorroga": 25, "descanso": 25,
      "asistencia": 45, "tapon": 45, "pasos": 45, "dobles": 45, "falta personal": 45, "zona": 45, "pivot": 45, "base": 45, "escolta": 45, "alero": 45, "ala pivot": 45, "carrilero": 45, "mediocentro": 45, "extremo": 45, "tie break": 45, "deuce": 45, "ace": 45, "saque directo": 45, "globo": 45, "dejada": 45, "volea": 45, "reves": 45, "drive": 45, "smash": 45, "remate": 45, "falta tecnica": 45, "falta antideportiva": 45, "tres segundos": 45, "campo atras": 45, "salto entre dos": 45, "guardameta": 45, "arquero": 45, "central": 45, "lateral": 45, "mediapunta": 45, "interior": 45, "punta": 45, "delantero centro": 45,
      "libero": 65, "ensayo": 65, "mele": 65, "touch": 65, "drop": 65, "falso nueve": 65, "pivote": 65, "enganche": 65, "interior derecho": 65, "interior izquierdo": 65, "rabona": 65, "chilena": 65, "vaselina": 65, "panenka": 65, "sombrero": 65, "caño": 65, "tunel": 65, "autopase": 65, "pared": 65, "contraataque": 65, "presion alta": 65, "fuera de juego posicional": 65, "gol olimpico": 65, "gol de oro": 65, "gol fantasma": 65, "hat trick": 65, "doblete": 65, "pichichi": 65,
      "strike": 85, "home run": 85, "touchdown": 85, "ippon": 85, "waza ari": 85, "ko": 85, "avant": 85, "pase adelantado": 85, "ruck": 85, "maul": 85, "placaje": 85, "conversion": 85, "golpe de castigo": 85, "zaguero": 85, "apertura": 85, "medio mele": 85, "talonador": 85, "pilier": 85, "segunda linea": 85, "flanker": 85,
      "gran willy": 100, "trequartista": 100, "regista": 100, "mezzala": 100, "raumdeuter": 100, "catenaccio": 100, "stopper": 100, "marcaje al hombre": 100, "zona press": 100, "box and one": 100, "triangulo ofensivo": 100, "cuernos": 100, "floppy": 100, "flare screen": 100
    }
  },
  {
    id: "dep-006", dailyId: "dia8-07", pack: "deportes",
    texto: "Club de fútbol internacional (Europa o América, fuera de España)",
    ejemplo: "estrella roja de belgrado",
    answers: {
      "manchester united": 10, "united": 10, "liverpool": 10, "manchester city": 10, "city": 10, "arsenal": 10, "chelsea": 10, "bayern munich": 10, "bayern": 10, "bayern de munich": 10, "borussia dortmund": 10, "dortmund": 10, "juventus": 10, "juve": 10, "inter de milan": 10, "inter": 10, "milan": 10, "ac milan": 10, "psg": 10, "paris saint germain": 10, "boca juniors": 10, "boca": 10,
      "river plate": 25, "river": 25, "inter miami": 25, "inter de miami": 25, "al nassr": 25, "al hilal": 25, "al ittihad": 25, "la galaxy": 25, "los angeles galaxy": 25, "new york cosmos": 25, "cosmos": 25, "wrexham": 25, "leicester": 25, "leicester city": 25, "leverkusen": 25, "bayer leverkusen": 25, "napoli": 25, "napoles": 25, "ajax": 25, "benfica": 25,
      "tottenham": 45, "tottenham hotspur": 45, "spurs": 45, "aston villa": 45, "newcastle": 45, "newcastle united": 45, "everton": 45, "west ham": 45, "leeds united": 45, "nottingham forest": 45, "celtic": 45, "celtic de glasgow": 45, "rangers": 45, "glasgow rangers": 45, "oporto": 45, "porto": 45, "fc porto": 45, "sporting de portugal": 45, "sporting de lisboa": 45, "psv": 45, "psv eindhoven": 45, "feyenoord": 45, "roma": 45, "as roma": 45, "lazio": 45, "fiorentina": 45, "torino": 45, "atalanta": 45, "marsella": 45, "olympique de marsella": 45, "lyon": 45, "olympique de lyon": 45, "monaco": 45, "as monaco": 45, "flamengo": 45, "palmeiras": 45, "santos": 45, "corinthians": 45,
      "sao paulo": 65, "gremio": 65, "internacional": 65, "fluminense": 65, "botafogo": 65, "vasco da gama": 65, "cruzeiro": 65, "atletico mineiro": 65, "independiente": 65, "racing de avellaneda": 65, "racing club": 65, "san lorenzo": 65, "estudiantes de la plata": 65, "velez sarsfield": 65, "newells old boys": 65, "newells": 65, "rosario central": 65, "peñarol": 65, "nacional de montevideo": 65, "nacional": 65, "colo colo": 65, "universidad de chile": 65, "olimpia": 65, "cerro porteño": 65, "atletico nacional": 65, "millonarios": 65, "america de cali": 65, "club america": 65,
      "chivas de guadalajara": 85, "cruz azul": 85, "pumas": 85, "tigres": 85, "monterrey": 85, "schalke 04": 85, "hamburgo": 85, "werder bremen": 85, "stuttgart": 85, "borussia monchengladbach": 85, "eintracht frankfurt": 85, "rb leipzig": 85, "lille": 85, "saint etienne": 85, "girondins de burdeos": 85, "nantes": 85, "sampdoria": 85, "parma": 85, "udinese": 85, "bolonia": 85,
      "estrella roja": 100, "estrella roja de belgrado": 100, "steaua de bucarest": 100, "dinamo de kiev": 100, "shakhtar donetsk": 100, "spartak de moscu": 100, "cska de moscu": 100, "zenit": 100, "galatasaray": 100, "fenerbahce": 100, "besiktas": 100, "olympiacos": 100, "panathinaikos": 100, "anderlecht": 100
    }
  },
  {
    id: "dep-007", dailyId: "dia9-04", pack: "deportes",
    texto: "Estadio, circuito de motor o pabellón deportivo legendario",
    ejemplo: "twickenham",
    answers: {
      "santiago bernabeu": 10, "bernabeu": 10, "el bernabeu": 10, "camp nou": 10, "el camp nou": 10, "nou camp": 10, "sanchez pizjuan": 10, "sanzhez pizjuan": 10, "benito villamarin": 10, "villamarin": 10, "metropolitano": 10, "civitas metropolitano": 10, "wanda metropolitano": 10, "wembley": 10, "maracana": 10, "san siro": 10, "la bombonera": 10, "bombonera": 10, "monumental": 10, "monumenta": 10, "roland garros": 10, "wimbledon": 10,
      "silverstone": 25, "monza": 25, "spa": 25, "spa francorchamps": 25, "madison square garden": 25, "wizink center": 25, "wizink": 25, "palau sant jordi": 25, "palau blaugrana": 25, "martin carpena": 25, "fernando buesa arena": 25, "buesa arena": 25, "la fonteta": 25, "olimpic de badalona": 25, "caja magica": 25, "la cartuja": 25, "estadio de la cartuja": 25, "montjuic": 25, "olimpico de montjuic": 25, "lluis companys": 25,
      "san mames": 45, "la catedral": 45, "mestalla": 45, "anoeta": 45, "reale arena": 45, "la ceramica": 45, "el madrigal": 45, "balaidos": 45, "riazor": 45, "el molinon": 45, "molinon": 45, "la rosaleda": 45, "rosaleda": 45, "el sadir": 45, "el sadar": 45, "son moix": 45, "vallecas": 45, "coliseum": 45, "butarque": 45, "ipurua": 45, "mendizorroza": 45, "zorrilla": 45, "jose zorrilla": 45, "el sardinero": 45, "nuevo los carmenes": 45, "carranza": 45, "nuevo mirandilla": 45, "helidoro rodriguez lopez": 45, "tartiere": 45, "carlos tartiere": 45, "la romareda": 45, "romareda": 45, "martinez valero": 45, "anfield": 45, "old trafford": 45, "stamford bridge": 45, "emirates": 45, "allianz arena": 45,
      "signal iduna park": 65, "westfalenstadion": 65, "parc des princes": 65, "parque de los principes": 65, "velodrome": 65, "giuseppe meazza": 65, "olimpico de roma": 65, "diego armando maradona": 65, "estadio azteca": 65, "azteca": 65, "centenario de montevideo": 65, "estadio centenario": 65, "da luz": 65, "do dragao": 65, "johan cruyff arena": 65, "celtic park": 65, "ibrox": 65, "suzuka": 65, "nurburgring": 65, "circuito de jerez": 65, "jerez": 65, "montmelo": 65, "circuito de cataluña": 65, "motorland": 65, "motorland aragon": 65, "cheste": 65, "ricardo tormo": 65, "jarama": 65,
      "interlagos": 85, "le mans": 85, "la sarthe": 85, "indianapolis": 85, "melbourne": 85, "albert park": 85, "monaco": 85, "montecarlo": 85, "imola": 85, "mugello": 85, "misano": 85, "assen": 85, "laguna seca": 85, "daytona": 85, "sebring": 85, "bathurst": 85, "us open": 85, "flushing meadows": 85, "arthur ashe": 85, "rod laver arena": 85,
      "o2 arena": 100, "staples center": 100, "crypto arena": 100, "united center": 100, "td garden": 100, "chase center": 100, "fenway park": 100, "yankee stadium": 100, "wrigley field": 100, "lambeau field": 100, "rose bowl": 100, "twickenham": 100, "croke park": 100, "aviva stadium": 100
    }
  },
  /* ----- Dossier Deportes · Capítulo 2: Motor, Raqueta y Competición de Élite ----- */
  {
    id: "dep-008", dailyId: "dia10-02", pack: "deportes",
    texto: "Piloto de Fórmula 1 o MotoGP (histórico o en activo)",
    ejemplo: "fernando alonso",
    answers: {
      "fernando alonso": 10, "alonso": 10, "marc marquez": 10, "marquez": 10, "carlos sainz": 10,
      "carlos sainz jr": 10, "carlos sainz hijo": 10, "sainz jr": 10, "lewis hamilton": 10, "hamilton": 10,
      "max verstappen": 10, "verstappen": 10, "valentino rossi": 10, "rossi": 10, "the doctor": 10,
      "jorge lorenzo": 10, "lorenzo": 10, "michael schumacher": 10, "schumacher": 10, "schumi": 10,
      "ayrton senna": 10, "senna": 10, "pedro acosta": 25, "acosta": 25, "el tiburon de mazarron": 25,
      "dani pedrosa": 25, "pedrosa": 25, "alex criville": 25, "criville": 25, "angel nieto": 25,
      "charles leclerc": 25, "leclerc": 25, "lando norris": 25, "norris": 25, "sebastian vettel": 25,
      "vettel": 25, "alain prost": 25, "prost": 25, "niki lauda": 25, "lauda": 25,
      "casey stoner": 25, "stoner": 25, "mick doohan": 25, "doohan": 25, "maverick viñales": 25,
      "viñales": 25, "joan mir": 25, "mir": 25, "jorge martin": 25, "martin": 25,
      "martinator": 25, "pecco bagnaia": 25, "francesco bagnaia": 25, "bagnaia": 25, "oscar piastri": 25,
      "piastri": 25, "george russell": 25, "russell": 25, "sete gibernau": 45, "gibernau": 45,
      "alvaro bautista": 45, "bautista": 45, "pol espargaro": 45, "espargaro": 45, "aleix espargaro": 45,
      "alex marquez": 45, "felipe massa": 45, "massa": 45, "jenson button": 45, "button": 45,
      "kimi raikkonen": 45, "raikkonen": 45, "rubens barrichello": 45, "barrichello": 45, "juan manuel fangio": 45,
      "fangio": 45, "jackie stewart": 45, "stewart": 45, "nigel mansell": 45, "mansell": 45,
      "damon hill": 45, "nico rosberg": 45, "rosberg": 45, "valtteri bottas": 45, "bottas": 45,
      "sergio perez": 45, "checo perez": 45, "daniel ricciardo": 45, "ricciardo": 45, "fabio quartararo": 45,
      "quartararo": 45, "el diablo": 45, "marco simoncelli": 45, "simoncelli": 45, "nicky hayden": 45,
      "hayden": 45, "alex barros": 45, "barros": 45, "david coulthard": 45, "coulthard": 45,
      "mark webber": 45, "webber": 45, "juan pablo montoya": 45, "montoya": 45, "giancarlo fisichella": 45,
      "fisichella": 45, "jarno trulli": 45, "trulli": 45, "eddie irvine": 45, "irvine": 45,
      "gerhard berger": 45, "berger": 45, "jean alesi": 45, "alesi": 45, "jacques villeneuve": 45,
      "villeneuve": 45, "franco colapinto": 55, "colapinto": 55, "liam lawson": 55, "yuki tsunoda": 55,
      "tsunoda": 55, "alex albon": 55, "albon": 55, "lance stroll": 55, "stroll": 55,
      "carlos checa": 65, "checa": 65, "andrea dovizioso": 65, "dovizioso": 65, "loris capirossi": 65,
      "capirossi": 65, "max biaggi": 65, "biaggi": 65, "cal crutchlow": 65, "danilo petrucci": 65,
      "miguel oliveira": 65, "brad binder": 65, "jack miller": 65, "alex rins": 65, "rins": 65,
      "pedro de la rosa": 85, "de la rosa": 85, "pedro martinez de la rosa": 85, "marc gene": 85, "gene": 85,
      "jaime alguersuari": 85, "alguersuari": 85, "luis salom": 85, "mexicano salom": 85, "toni elias": 85,
      "elias": 85, "emilio alzamora": 85, "alzamora": 85, "alberto puig": 85, "puig": 85,
      "carlos lavado": 85, "wayne rainey": 85, "rainey": 85, "kevin schwantz": 85, "schwantz": 85,
      "eddie lawson": 85, "freddie spencer": 85, "spencer": 85, "fast freddie": 85, "gilles villeneuve": 85,
      "ronnie peterson": 85, "peterson": 85, "james hunt": 85, "hunt": 85, "emerson fittipaldi": 85,
      "fittipaldi": 85, "jack brabham": 85, "brabham": 85, "stirling moss": 85, "moss": 85,
      "pastor maldonado": 85, "maldonado": 85, "kamui kobayashi": 85, "kobayashi": 85, "heikki kovalainen": 85,
      "kovalainen": 85, "robert kubica": 85, "kubica": 85, "romain grosjean": 85, "grosjean": 85,
      "kevin magnussen": 85, "magnussen": 85, "nico hulkenberg": 85, "hulkenberg": 85, "esteban ocon": 85,
      "ocon": 85, "pierre gasly": 85, "gasly": 85, "giacomo agostini": 85, "agostini": 85,
      "mike hailwood": 85, "hailwood": 85, "kenny roberts": 85, "wayne gardner": 85, "gardner": 85,
      "jorge martinez aspar": 85, "aspar": 85, "ricardo tormo": 85, "tormo": 85, "alfonso de portago": 100,
      "marques de portago": 100, "portago": 100, "paco godia": 100, "godia": 100, "francisco godia": 100,
      "paco bulto": 100, "bulto": 100, "alex solos": 100, "sito pons": 100, "pons": 100,
      "juan garriga": 100, "garriga": 100, "borja garcia": 100, "adrian valles": 100, "valles": 100,
      "roberto merhi": 100, "merhi": 100, "luca badoer": 100, "badoer": 100, "tarso marques": 100,
      "jos verstappen": 100, "pierluigi martini": 100, "takuma sato": 100, "sato": 100, "john surtees": 100,
      "surtees": 100, "jochen rindt": 100, "rindt": 100, "phil hill": 100, "mike hawthorn": 100,
      "hawthorn": 100, "kenny roberts jr": 100, "luca marini": 100, "marini": 100, "tiziano caruso": 100,
      "bruno senna": 100, "jolyon palmer": 100, "marcus ericsson": 100, "rio haryanto": 100, "haryanto": 100,
      "carlo ubbiali": 100, "ubbiali": 100, "luigi taveria": 100, "luigi taveri": 100, "taveri": 100,
      "victor palomo": 100, "palomo": 100, "fonsi nieto": 100, "angel nieto jr": 100, "gelete nieto": 100,
      "luis d antin": 100, "d antin": 100, "chicho lorenzo": 100, "joan garriga": 100, "antonio zambujo": 100,
      "miki biasion": 100, "esteban guerreri": 100, "tiago monteiro": 100, "monteiro": 100, "narain karthikeyan": 100,
      "karthikeyan": 100, "anthony davidson": 100, "davidson": 100, "allan mcnish": 100, "mcnish": 100,
      "mika salo": 100, "salo": 100, "pedro lamy": 100, "lamy": 100
    }
  },
  {
    id: "dep-009", dailyId: "dia11-05", pack: "deportes",
    texto: "Jugador de baloncesto legendario de la NBA o Liga ACB",
    ejemplo: "michael jordan",
    answers: {}
  },
  {
    id: "dep-010", dailyId: "dia11-02", pack: "deportes",
    texto: "Tenista profesional de élite (circuito ATP o WTA)",
    ejemplo: "rafa nadal",
    answers: {}
  },
  {
    id: "dep-011", dailyId: "dia12-05", pack: "deportes",
    texto: "Deporte de combate, arte marcial o lucha reglada",
    ejemplo: "judo",
    answers: {}
  },
  {
    id: "dep-012", dailyId: "dia13-01", pack: "deportes",
    texto: "Futbolista ganador del Balón de Oro (masculino o femenino)",
    ejemplo: "lionel messi",
    answers: {}
  },
  {
    id: "dep-013", dailyId: "dia14-03", pack: "deportes",
    texto: "Competición, torneo, copa o gran premio deportivo internacional",
    ejemplo: "copa del mundo",
    answers: {}
  },
  {
    id: "dep-014", dailyId: "dia14-06", pack: "deportes",
    texto: "Deporte de invierno o disputado sobre nieve/hielo",
    ejemplo: "esqui alpino",
    answers: {}
  },

  /* ----- Dossier Deportes · Capítulo 3: Resistencia, Campo y Leyendas ----- */
  {
    id: "dep-015", dailyId: "dia15-07", pack: "deportes",
    texto: "Prueba, modalidad o especialidad de atletismo",
    ejemplo: "salto de longitud",
    answers: {}
  },
  {
    id: "dep-016", dailyId: "dia15-05", pack: "deportes",
    texto: "Deporte que se dispute sin balón ni pelota",
    ejemplo: "natacion",
    answers: {}
  },
  {
    id: "dep-017", dailyId: "dia16-03", pack: "deportes",
    texto: "Ciclista profesional o equipo ciclista del WorldTour",
    ejemplo: "miguel indurain",
    answers: {}
  },
  {
    id: "dep-018", dailyId: "dia17-01", pack: "deportes",
    texto: "Deporte acuático, náutico o subacuático",
    ejemplo: "waterpolo",
    answers: {}
  },
  {
    id: "dep-019", dailyId: "dia18-07", pack: "deportes",
    texto: "Entrenador o seleccionador histórico de fútbol o baloncesto",
    ejemplo: "pep guardiola",
    answers: {}
  },
  {
    id: "dep-020", dailyId: "dia18-02", pack: "deportes",
    texto: "Apodo oficial o popular de un club de fútbol o selección deportiva",
    ejemplo: "la roja",
    answers: {}
  },
  {
    id: "dep-021", dailyId: "dia19-01", pack: "deportes",
    texto: "Escudería, fabricante o marca vinculada al motorsport de competición",
    ejemplo: "ferrari",
    answers: {}
  },
  {
    id: "geo-001", dailyId: "dia5-01", pack: "geografia",
    texto: "Río de Europa",
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
    id: "geo-002", dailyId: "dia6-02", pack: "geografia",
    texto: "Capital de un país soberano del mundo",
    ejemplo: "ngerulmud",
    answers: {
      "madrid": 10, "paris": 10, "londres": 10, "roma": 10, "berlin": 10, "lisboa": 10, "washington": 10, "pekin": 10, "tokio": 10, "moscu": 10, "buenos aires": 10, "bogota": 10, "lima": 10, "santiago": 10, "ciudad de mexico": 10, "viena": 10, "atenas": 10, "dublin": 10, "bruselas": 10, "amsterdam": 10, "washington dc": 10, "santiago de chile": 10,
      "nueva york": 25, "barcelona": 25, "sydney": 25, "sidney": 25, "rio de janeiro": 25, "estambul": 25, "zurich": 25, "ginebra": 25, "casablanca": 25, "marrakech": 25, "el vaticano": 25, "ciudad del vaticano": 25, "jerusalen": 25, "tel aviv": 25, "la haya": 25, "toronto": 25, "miami": 25, "los angeles": 25, "chicago": 25, "milan": 25,
      "ottawa": 45, "brasilia": 45, "canberra": 45, "el cairo": 45, "nairobi": 45, "pretoria": 45, "argel": 45, "rabat": 45, "tunez": 45, "dakar": 45, "nueva delhi": 45, "bangkok": 45, "hanoi": 45, "manila": 45, "yakarta": 45, "seul": 45, "kiev": 45, "varsovia": 45, "praga": 45, "budapest": 45, "bucarest": 45, "sofia": 45, "belgrado": 45, "zagreb": 45, "ankara": 45, "oslo": 45, "estocolmo": 45, "helsinki": 45, "copenhague": 45, "berna": 45, "andorra la vieja": 45, "la valeta": 45, "wellington": 45, "tegucigalpa": 45, "managua": 45, "san jose": 45, "panama": 45, "la habana": 45,
      "tripoli": 65, "acra": 65, "abuya": 65, "adis abeba": 65, "teheran": 65, "bagdad": 65, "riad": 65, "doha": 65, "abu dabi": 65, "islamabad": 65, "kabul": 65, "pionyang": 65, "ulan bator": 65, "astana": 65, "taskent": 65, "tiflis": 65, "erevan": 65, "baku": 65, "minsk": 65, "tirana": 65, "nicosia": 65, "reikiavik": 65, "tallin": 65, "riga": 65, "vilna": 65, "luxemburgo": 65, "monaco": 65, "san marino": 65,
      "vaduz": 85, "suva": 85, "paramaribo": 85, "santo domingo": 85, "puerto principe": 85, "kingston": 85, "quito": 85, "la paz": 85, "sucre": 85, "asuncion": 85, "montevideo": 85, "caracas": 85, "georgetown": 85, "basseterre": 85, "castries": 85, "kingstown": 85, "bridgetown": 85, "puerto españa": 85, "saint george": 85, "roseau": 85,
      "ngerulmud": 100, "funafuti": 100, "tarawa": 100, "majuro": 100, "palikir": 100, "apia": 100, "nukualofa": 100, "port vila": 100, "honiara": 100, "port moresby": 100, "dili": 100, "bandar seri begawan": 100, "naipyido": 100, "vientian": 100
    }
  },
  {
    id: "geo-003", dailyId: "dia6-03", pack: "geografia",
    texto: "Isla o archipiélago del mundo (español o internacional)",
    ejemplo: "kerguelen",
    answers: {
      "mallorca": 10, "menorca": 10, "ibiza": 10, "formentera": 10, "tenerife": 10, "gran canaria": 10, "lanzarote": 10,
      "fuerteventura": 10, "la palma": 10, "la gomera": 10, "el hierro": 10, "sicilia": 10, "cerdeña": 10, "creta": 10,
      "gran bretaña": 10, "irlanda": 10, "islandia": 10, "cuba": 10, "hierro": 10, "islas baleares": 10, "baleares": 10,
      "manhattan": 25, "australia": 25, "japon": 25, "reino unido": 25, "inglaterra": 25, "nueva zelanda": 25, "indonesia": 25,
      "isla magica": 25, "la isla de las tentaciones": 25, "isla del tesoro": 25, "atlantida": 25, "alcatraz": 25, "isla de man": 25, "gibraltar": 25,
      "peninsula iberica": 25, "venecia": 25, "cabo de gata": 25, "tarifa": 25, "islantilla": 25,
      "madagascar": 45, "filipinas": 45, "cabrera": 45, "la graciosa": 45, "islas cies": 45, "tabarca": 45, "corcega": 45,
      "chipre": 45, "malta": 45, "rodos": 45, "santorini": 45, "miconos": 45, "corfu": 45, "groenlandia": 45,
      "jamaica": 45, "puerto rico": 45, "bahamas": 45, "maldivas": 45, "seychelles": 45, "mauricio": 45, "zanzibar": 45,
      "sri lanka": 45, "bali": 45, "taiwan": 45, "isla de pascua": 45, "galapagos": 45, "malvinas": 45, "hawai": 45,
      "tahiti": 45, "fiyi": 45, "samoa": 45, "tasmania": 45, "azores": 45, "madeira": 45, "cabo verde": 45,
      "cies": 45, "isla de tabarca": 45, "mykonos": 45, "ceilan": 45, "hawaii": 45,
      "isla cristina": 65, "buda": 65, "lesbos": 65, "la española": 65, "reunion": 65, "sumatra": 65, "java": 65,
      "borneo": 65, "celebes": 65, "luzon": 65, "mindanao": 65, "honshu": 65, "hokkaido": 65, "kyushu": 65,
      "okinawa": 65, "tierra del fuego": 65, "chiloe": 65, "nueva guinea": 65, "islas feroe": 65, "isla de buda": 65, "isla de la reunion": 65,
      "feroe": 65, "isla de ons": 65, "ons": 65, "isla de arousa": 65, "arousa": 65, "la toja": 65, "isla de la toja": 65,
      "svalbard": 85, "nueva zembla": 85, "sajalin": 85, "islas kuriles": 85, "kuriles": 85, "islas aleutianas": 85, "aleutianas": 85,
      "isla de baffin": 85, "baffin": 85, "isla victoria": 85, "isla de ellesmere": 85, "terranova": 85, "isla del principe eduardo": 85, "isla de vancouver": 85,
      "cozumel": 85, "isla mujeres": 85, "margarita": 85, "isla margarita": 85, "curazao": 85, "aruba": 85,
      "kerguelen": 100, "islas kerguelen": 100, "islas crozet": 100, "isla bouvet": 100, "georgias del sur": 100, "sandwich del sur": 100, "isla de wrangel": 100,
      "tierra de francisco jose": 100, "severnaya zemlya": 100, "islas de nueva siberia": 100, "isla de bancos": 100, "isla de devon": 100, "isla de melville": 100, "isla de southampton": 100,
      "palaos": 100, "islas salomon": 100, "solomon": 100
    }
  },
  {
    id: "geo-004", dailyId: "dia7-04", pack: "geografia",
    texto: "Cordillera, sierra, volcán o pico montañoso del mundo",
    ejemplo: "gankhar puensum",
    answers: {
      "everest": 10, "teide": 10, "mulhacen": 10, "aneto": 10, "picos de europa": 10, "pirineos": 10, "sierra nevada": 10, "alpes": 10, "andes": 10, "himalaya": 10, "kilimanjaro": 10, "fuji": 10, "vesubio": 10, "etna": 10, "monte everest": 10, "el teide": 10, "los pirineos": 10, "los alpes": 10, "los andes": 10, "cordillera de los andes": 10, "el himalaya": 10, "monte fuji": 10,
      "montaña": 25, "volcan": 25, "colina": 25, "cerro": 25, "cordillera": 25, "sierra": 25, "pico": 25, "cumbre": 25, "cima": 25, "valle": 25, "meseta": 25, "acantilado": 25, "cañon": 25, "glaciar": 25, "nieve": 25, "roca": 25, "monte olimpo": 25, "olimpo": 25, "monte del destino": 25, "mordor": 25,
      "sierra morena": 45, "sistema central": 45, "sistema iberico": 45, "cordillera cantabrica": 45, "montes de toledo": 45, "subbetica": 45, "moncayo": 45, "almanzor": 45, "peñalara": 45, "urriellu": 45, "naranjo de bulnes": 45, "montserrat": 45, "mont blanc": 45, "cervino": 45, "matterhorn": 45, "apeninos": 45, "carpatos": 45, "balcanes": 45, "urales": 45, "caucaso": 45, "aconcagua": 45, "k2": 45, "annapurna": 45, "atlas": 45, "montañas rocosas": 45, "apalaches": 45, "sierra madre": 45, "popocatepetl": 45, "krakatoa": 45, "timanfaya": 45, "cumbre vieja": 45, "cordillera subbetica": 45, "pico almanzor": 45, "picu urriellu": 45, "montes urales": 45, "cordillera del atlas": 45, "rocosas": 45, "montes apalaches": 45,
      "elbrus": 65, "chimborazo": 65, "cotopaxi": 65, "huascaran": 65, "kangchenjunga": 65, "karakorum": 65, "monte kenia": 65, "mckinley": 65, "denali": 65, "estromboli": 65, "mauna loa": 65, "santa helena": 65, "eyjafjallajokull": 65, "monte elbrus": 65, "monte denali": 65, "stromboli": 65, "monte santa helena": 65, "veleta": 65, "pico veleta": 65, "alcazaba": 65, "monte perdido": 65, "posets": 65, "pica d estats": 65, "pedraforca": 65, "puigmal": 65, "canigo": 65, "puig major": 65, "aitxuri": 65,
      "lhotse": 85, "makalu": 85, "cho oyu": 85, "dhaulagiri": 85, "manaslu": 85, "nanga parbat": 85, "gasherbrum": 85, "broad peak": 85, "shishapangma": 85, "fitz roy": 85, "monte fitz roy": 85, "cerro torre": 85, "ojos del salado": 85, "illimani": 85, "sajama": 85, "galeras": 85, "nevado del ruiz": 85, "paricutin": 85, "iztaccihuatl": 85, "pico de orizaba": 85,
      "gankhar puensum": 100, "jannu": 100, "amne machin": 100, "kailash": 100, "monte kailash": 100, "namcha barwa": 100, "minya konka": 100, "kongur": 100, "muztata": 100, "muztagh ata": 100, "pik kommunizma": 100, "pico ismoil somoni": 100, "pico lenin": 100, "khan tengri": 100
    }
  },
  {
    id: "geo-005", dailyId: "dia8-05", pack: "geografia",
    texto: "Ciudad importante del mundo que NO es la capital de su país",
    ejemplo: "samarcanda",
    answers: {
      "barcelona": 10, "sevilla": 10, "valencia": 10, "malaga": 10, "bilbao": 10, "zaragoza": 10, "nueva york": 10, "los angeles": 10, "chicago": 10, "miami": 10, "san francisco": 10, "las vegas": 10, "rio de janeiro": 10, "sao paulo": 10, "milan": 10, "napoles": 10, "venecia": 10, "florencia": 10, "munich": 10, "manchester": 10, "liverpool": 10, "estambul": 10,
      "madrid": 25, "paris": 25, "londres": 25, "roma": 25, "berlin": 25, "tokio": 25, "washington": 25, "buenos aires": 25, "ciudad de mexico": 25, "bogota": 25, "lima": 25, "santiago": 25, "lisboa": 25, "amsterdam": 25, "bruselas": 25, "viena": 25, "moscu": 25, "pekin": 25, "el cairo": 25, "canberra": 25,
      "houston": 45, "boston": 45, "seattle": 45, "toronto": 45, "vancouver": 45, "montreal": 45, "medellin": 45, "cali": 45, "cartagena de indias": 45, "guayaquil": 45, "maracaibo": 45, "cordoba": 45, "rosario": 45, "mar del plata": 45, "valparaiso": 45, "tijuana": 45, "guadalajara": 45, "monterrey": 45, "cancun": 45, "turin": 45, "bolonia": 45, "marsella": 45, "lyon": 45, "niza": 45, "burdeos": 45, "toulouse": 45, "hamburgo": 45, "francfort": 45, "colonia": 45, "dortmund": 45, "stuttgart": 45, "birmingan": 45, "glasgow": 45, "edimburgo": 45, "oporto": 45, "rotterdam": 45, "la haya": 45, "amberes": 45,
      "brujas": 65, "ginebra": 65, "zurich": 65, "basilea": 65, "salzburgo": 65, "cracovia": 65, "jerusalen": 65, "tel aviv": 65, "casablanca": 65, "marrakech": 65, "tanger": 65, "alejandria": 65, "johannesburgo": 65, "ciudad del cabo": 65, "durban": 65, "lagos": 65, "bombay": 65, "mumbai": 65, "calcuta": 65, "bangalore": 65, "shanghai": 65, "hong kong": 65, "shenzhen": 65, "canton": 65, "wuhan": 65, "kioto": 65, "osaka": 65, "yokohama": 65,
      "hiroshima": 85, "busan": 85, "sidney": 85, "melbourne": 85, "auckland": 85, "dubai": 85, "dallas": 85, "filadelfia": 85, "philadelphia": 85, "phoenix": 85, "san antonio": 85, "san diego": 85, "detroit": 85, "atlanta": 85, "denver": 85, "orlando": 85, "nueva orleans": 85, "baltimore": 85, "pittsburgh": 85, "cleveland": 85,
      "samarcanda": 100, "fez": 100, "meknes": 100, "tetuan": 100, "agadir": 100, "oujda": 100, "oran": 100, "constantina": 100, "annaba": 100, "sfax": 100, "susa": 100, "bengasi": 100, "misrata": 100, "luxor": 100
    }
  },
  {
    id: "geo-006", dailyId: "dia8-04", pack: "geografia",
    texto: "Mar, océano, golfo, estrecho o masa de agua singular",
    ejemplo: "mar de los sargazos",
    answers: {
      "mar mediterraneo": 10, "mediterraneo": 10, "el mediterraneo": 10, "oceano atlantico": 10, "atlantico": 10, "el atlantico": 10, "oceano pacifico": 10, "pacifico": 10, "el pacifico": 10, "mar caribe": 10, "caribe": 10, "el caribe": 10, "mar muerto": 10, "mar rojo": 10, "mar negro": 10, "golfo de mexico": 10, "estrecho de gibraltar": 10, "gibraltar": 10, "canal de panama": 10, "canal de suez": 10, "mar cantabrico": 10, "cantabrico": 10,
      "oceano indico": 25, "indico": 25, "oceano artico": 25, "artico": 25, "oceano antartico": 25, "antartico": 25, "mar menor": 25, "el mar menor": 25, "canal de la mancha": 25, "bahia de cadiz": 25, "golfo de cadiz": 25, "golfo de vizcaya": 25, "mar de alboran": 25, "cataratas del niagara": 25, "niagara": 25, "cataratas del iguazu": 25, "iguazu": 25, "lago ness": 25, "lago victoria": 25,
      "mar del norte": 45, "mar baltico": 45, "baltico": 45, "mar caspio": 45, "caspio": 45, "mar adriatico": 45, "adriatico": 45, "mar egeo": 45, "egeo": 45, "mar jonico": 45, "jonico": 45, "mar tirreno": 45, "tirreno": 45, "golfo persico": 45, "estrecho de bering": 45, "bering": 45, "estrecho del bosforo": 45, "bosforo": 45, "estrecho de magallanes": 45, "magallanes": 45, "estrecho de malaca": 45, "lago titicaca": 45, "titicaca": 45, "lago baikal": 45, "baikal": 45, "mar de aral": 45, "mar de china": 45, "mar del japon": 45, "mar amarillo": 45, "mar de coral": 45, "mar de tasmania": 45, "mar de barents": 45, "mar blanco": 45, "mar de azov": 45, "mar de marmara": 45, "mar arabigo": 45, "golfo de bengala": 45, "golfo de guinea": 45,
      "estrecho de ormuz": 65, "ormuz": 65, "estrecho de los dardanelos": 65, "dardanelos": 65, "estrecho de mesina": 65, "estrecho de taiwan": 65, "paso de drake": 65, "pasaje de drake": 65, "golfo de aden": 65, "golfo de oman": 65, "golfo de alaska": 65, "golfo de california": 65, "golfo de san lorenzo": 65, "golfo de leon": 65, "golfo de valencia": 65, "bahia de hudson": 65, "bahia de bengala": 65, "bahia de cochinos": 65, "bahia de san francisco": 65, "bahia de santander": 65, "bahia de la concha": 65, "bahia de algeciras": 65, "ria de vigo": 65, "ria de arousa": 65, "lago michigan": 65, "lago superior": 65, "lago tanganica": 65, "lago maracaibo": 65,
      "canal de corinto": 85, "canal de kiel": 85, "estrecho de cook": 85, "estrecho de bass": 85, "mar de weddell": 85, "mar de ross": 85, "mar de java": 85, "mar de andaman": 85, "mar de timor": 85, "mar de sulu": 85, "mar de celebes": 85, "mar de okhotsk": 85, "lago huron": 85, "lago erie": 85, "lago ontario": 85, "lago malawi": 85, "lago chad": 85, "lago de sanabria": 85, "la albufera": 85, "albufera de valencia": 85,
      "mar de los sargazos": 100, "fosa de las marianas": 100, "triangulo de las bermudas": 100, "corriente del golfo": 100, "salto angel": 100, "cataratas victoria": 100, "estrecho de bab el mandeb": 100, "bab el mandeb": 100, "estrecho de torres": 100, "estrecho de sunda": 100, "canal de mozambique": 100, "canal de beagle": 100, "mar de kara": 100, "mar de laptev": 100
    }
  },
  {
    id: "geo-007", dailyId: "dia9-07", pack: "geografia",
    texto: "Monumento, construcción emblemática o maravilla histórica de la humanidad",
    ejemplo: "mausoleo de halicarnaso",
    answers: {
      "torre eiffel": 10, "la torre eiffel": 10, "coliseo": 10, "el coliseo": 10, "coliseo romano": 10, "gran muralla china": 10, "muralla china": 10, "la muralla china": 10, "taj mahal": 10, "el taj mahal": 10, "piramides de giza": 10, "las piramides": 10, "piramides de egipto": 10, "estatua de la libertad": 10, "la estatua de la libertad": 10, "big ben": 10, "el big ben": 10, "giralda": 10, "la giralda": 10, "alhambra": 10, "la alhambra": 10, "sagrada familia": 10, "alhambra de granada": 25, "mezquita de cordoba": 25, "la mezquita de cordoba": 25, "acueducto de segovia": 25, "el acueducto de segovia": 25, "catedral de santiago": 25, "catedral de santiago de compostela": 25, "plaza mayor": 25, "palacio real": 25, "alcazar de sevilla": 25, "puerta de alcala": 25, "la puerta de alcala": 25, "puerta del sol": 25, "la cibeles": 25, "fuente de cibeles": 25, "el prado": 25, "museo del prado": 25, "guggenheim": 25, "museo guggenheim": 25,
      "partenon": 45, "el partenon": 45, "acropolis": 45, "la acropolis": 45, "machu picchu": 45, "cristo redentor": 45, "el cristo redentor": 45, "cristo del corcovado": 45, "chichen itza": 45, "petra": 45, "torre de pisa": 45, "la torre de pisa": 45, "louvre": 45, "el louvre": 45, "museo del louvre": 45, "notre dame": 45, "catedral de notre dame": 45, "arco del triunfo": 45, "el arco del triunfo": 45, "torre de londres": 45, "stonehenge": 45, "empire state": 45, "burj khalifa": 45, "opera de sidney": 45, "santa sofia": 45, "muro de berlin": 45, "el muro de berlin": 45, "kremlin": 45, "el kremlin": 45, "plaza roja": 45, "catedral de burgos": 45, "catedral de leon": 45, "catedral de sevilla": 45, "catedral de toledo": 45, "basilica del pilar": 45, "el pilar": 45, "el escorial": 45, "monasterio del escorial": 45,
      "teatro romano de merida": 65, "muralla de avila": 65, "alcazar de segovia": 65, "alcazar de toledo": 65, "torre del oro": 65, "la torre del oro": 65, "plaza de españa": 65, "ciudad de las artes y las ciencias": 65, "casa batllo": 65, "la pedrera": 65, "casa mila": 65, "park guell": 65, "parque guell": 65, "puerta de brandeburgo": 65, "fontana di trevi": 65, "panteon de agripa": 65, "panteon de roma": 65, "basilica de san pedro": 65, "capilla sixtina": 65, "tower bridge": 65, "puente de londres": 65, "palacio de buckingham": 65, "buckingham palace": 65, "palacio de versalles": 65, "versalles": 65, "mont saint michel": 65, "atomium": 65, "casa blanca": 65, "capitolio": 85, "golden gate": 85, "puente de brooklyn": 85, "monte rushmore": 85, "moais": 85, "isla de pascua": 85, "piramide de keops": 85, "esfinge": 85, "la esfinge": 85, "templo de luxor": 85, "abu simbel": 85, "angkor wat": 85, "ciudad prohibida": 85, "guerreros de terracota": 85, "guerreros de xian": 85, "templo del cielo": 85, "torre de tokio": 85, "torres petronas": 85, "taipei 101": 85,
      "mausoleo de halicarnaso": 100, "coloso de rodas": 100, "faro de alejandria": 100, "jardines colgantes de babilonia": 100, "templo de artemisa": 100, "estatua de zeus": 100, "buda de lishan": 100, "borobudur": 100, "bagan": 100, "persepolis": 100, "zigurat de ur": 100, "iglesias de lalibela": 100, "mezquita de djenne": 100, "castillo de neuschwanstein": 100
    }
  },
  /* ----- Dossier Geografía · Capítulo 2: Geografía Nacional e Ibérica ----- */
  {
    id: "geo-008", dailyId: "dia10-04", pack: "geografia",
    texto: "Provincia, comarca o comunidad autónoma de España",
    ejemplo: "caceres",
    answers: {
      "andalucia": 10, "cataluña": 10, "catalunya": 10, "madrid": 10, "comunidad de madrid": 10,
      "galicia": 10, "pais vasco": 10, "euskadi": 10, "comunidad valenciana": 10, "comunitat valenciana": 10,
      "castilla y leon": 10, "sevilla": 10, "barcelona": 10, "valencia": 10, "aragon": 25,
      "canarias": 25, "islas canarias": 25, "islas baleares": 25, "baleares": 25, "illes balears": 25,
      "castilla-la mancha": 25, "castilla la mancha": 25, "extremadura": 25, "asturias": 25, "principado de asturias": 25,
      "cantabria": 25, "navarra": 25, "comunidad foral de navarra": 25, "la rioja": 25, "rioja": 25,
      "region de murcia": 25, "murcia": 25, "malaga": 25, "cadiz": 25, "granada": 25,
      "a coruña": 25, "la coruña": 25, "coruña": 25, "pontevedra": 25, "vizcaya": 25,
      "bizkaia": 25, "guipuzcoa": 25, "gipuzkoa": 25, "alava": 25, "araba": 25,
      "zaragoza": 25, "alicante": 25, "alacant": 25, "huelva": 45, "jaen": 45,
      "cordoba": 45, "almeria": 45, "ourense": 45, "orense": 45, "lugo": 45,
      "leon": 45, "zamora": 45, "salamanca": 45, "valladolid": 45, "palencia": 45,
      "burgos": 45, "soria": 45, "segovia": 45, "avila": 45, "toledo": 45,
      "ciudad real": 45, "cuenca": 45, "guadalajara": 45, "albacete": 45, "caceres": 45,
      "badajoz": 45, "huesca": 45, "teruel": 45, "castellon": 45, "castellon de la plana": 45,
      "castello": 45, "tarragona": 45, "lleida": 45, "lerida": 45, "girona": 45,
      "gerona": 45, "las palmas": 45, "santa cruz de tenerife": 45, "tenerife": 45, "ceuta": 45,
      "melilla": 45, "el bierzo": 45, "bierzo": 45, "la mancha": 45, "mancha": 45,
      "la alcarria": 45, "alcarria": 45, "las alpujarras": 45, "alpujarras": 45, "alpujarra": 45,
      "la alpujarra": 45, "el aljarafe": 45, "aljarafe": 45, "tierra de campos": 45, "la siberia": 45,
      "siberia": 45, "el maestrazgo": 45, "maestrazgo": 45, "rioja alta": 45, "rioja alavesa": 45,
      "rioja media": 45, "rioja baja": 45, "las hurdes": 45, "hurdes": 45, "liebana": 45,
      "valle de liebana": 45, "serrania de ronda": 85, "campo de gibraltar": 85, "comarca de doñana": 85, "doñana": 85,
      "vega de granada": 85, "valle del jerte": 85, "jerte": 85, "la vera": 85, "vera": 85,
      "tentudia": 85, "la serena": 85, "serena": 85, "tierra de barros": 85, "campoo": 85,
      "valles pasiegos": 85, "la maragateria": 85, "maragateria": 85, "babia": 85, "laciana": 85,
      "sanabria": 85, "la carballeda": 85, "carballeda": 85, "sayago": 85, "la moraña": 85,
      "moraña": 85, "valle del tietar": 85, "tietar": 85, "ribera del duero": 85, "osona": 85,
      "el valles occidental": 85, "valles occidental": 85, "el valles oriental": 85, "valles oriental": 85, "el maresme": 85,
      "maresme": 85, "el emporda": 85, "emporda": 85, "alt emporda": 85, "baix emporda": 85,
      "bages": 85, "selva": 85, "la selva": 85, "segria": 85, "el priorat": 85,
      "priorat": 85, "la terra alta": 85, "terra alta": 85, "somontano": 85, "somontano de barbastro": 85,
      "sobrarbe": 85, "ribagorza": 85, "jacetania": 85, "la jacetania": 85, "cinco villas": 85,
      "las cinco villas": 85, "campo de borja": 85, "l'horta": 85, "horta": 85, "l'horta de valencia": 85,
      "horta de valencia": 85, "la safor": 85, "safor": 85, "la marina alta": 85, "marina alta": 85,
      "la marina baixa": 85, "marina baixa": 85, "el comtat": 85, "comtat": 85, "bajo aragon": 85,
      "comarca del ebro": 85, "tarragones": 85, "garraf": 85, "el garraf": 85, "alt penedes": 85,
      "penedes": 85, "baix penedes": 85, "val d'aran": 100, "valle de aran": 100, "aran": 100,
      "la cerdaña": 100, "cerdaña": 100, "cerdanya": 100, "la cerdanya": 100, "alt urgell": 100,
      "urgell": 100, "pallars sobira": 100, "pallars jussa": 100, "el condao": 100, "el condado": 100,
      "condado de huelva": 100, "sierra sur de sevilla": 100, "sierra sur": 100, "sierra norte de sevilla": 100, "los pedroches": 100,
      "pedroches": 100, "valle del guadiato": 100, "guadiato": 100, "campiña sur": 100, "sierra magina": 100,
      "magina": 100, "sierra de cazorla": 100, "sierra de segura": 100, "los velez": 100, "velez": 100,
      "almazora": 100, "valle de ricote": 100, "ricote": 100, "alto palancia": 100, "alto mijares": 100,
      "rincon de ademuz": 100, "ademuz": 100, "serrania de cuenca": 100, "la manchuela": 100, "manchuela": 100,
      "señorio de molina": 100, "sierra norte de guadalajara": 100, "el cerrato": 100, "cerrato": 100, "montserrat": 100,
      "la guarguera": 100, "guarguera": 100, "albarracin": 100, "sierra de albarracin": 100, "matarraña": 100,
      "comarca del aranda": 100, "aranda": 100, "campo de belchite": 100, "belchite": 100, "tarazona y el moncayo": 100,
      "moncayo": 100, "las merindades": 100, "merindades": 100, "el paramo": 100, "paramo": 100,
      "los ancares": 100, "ancares": 100, "valle de arbas": 100, "la lora": 100, "encartaciones": 100,
      "las encartaciones": 100, "uribe": 100, "duranguesado": 100, "goierri": 100, "tolosaldea": 100,
      "busturialdea": 100, "lea-artibai": 100, "urola kosta": 100, "campiña de carmona": 100, "costa noroeste": 100,
      "comarca de andevalo": 100, "el andevalo": 100, "andevalo": 100
    }
  },
  {
    id: "geo-009", dailyId: "dia10-03", pack: "geografia",
    texto: "Municipio, pueblo o ciudad de Andalucía",
    ejemplo: "ronda",
    answers: {
      "sevilla": 10, "malaga": 10, "cordoba": 10, "granada": 10, "cadiz": 10,
      "almeria": 10, "huelva": 10, "jaen": 10, "jerez de la frontera": 10, "jerez": 10,
      "marbella": 10, "dos hermanas": 25, "alcala de guadaira": 25, "algeciras": 25, "san fernando": 25,
      "el puerto de santa maria": 25, "puerto de santa maria": 25, "el puerto": 25, "chiclana de la frontera": 25, "chiclana": 25,
      "roquetas de mar": 25, "roquetas": 25, "el ejido": 25, "ejido": 25, "mijas": 25,
      "fuengirola": 25, "torremolinos": 25, "benalmadena": 25, "estepona": 25, "velez-malaga": 25,
      "velez malaga": 25, "motril": 25, "linares": 25, "ubeda": 25, "baeza": 25,
      "antequera": 25, "ronda": 25, "carmona": 25, "ecija": 25, "utrera": 25,
      "lebrija": 25, "sanlucar de barrameda": 25, "sanlucar": 25, "osuna": 45, "marchena": 45,
      "moron de la frontera": 45, "moron": 45, "cazalla de la sierra": 45, "cazalla": 45, "constantina": 45,
      "lora del rio": 45, "coria del rio": 45, "bormujos": 45, "tomares": 45, "mairena del aljarafe": 45,
      "camas": 45, "alhaurin de la torre": 45, "alhaurin el grande": 45, "coin": 45, "nerja": 45,
      "torrox": 45, "archidona": 45, "cazorla": 45, "andujar": 45, "bailen": 45,
      "martos": 45, "priego de cordoba": 45, "priego": 45, "lucena": 45, "cabra": 45,
      "montilla": 45, "palma del rio": 45, "puente genil": 45, "rota": 45, "tarifa": 45,
      "barbate": 45, "conil de la frontera": 45, "conil": 45, "ubrique": 45, "arcos de la frontera": 45,
      "arcos": 45, "grazalema": 45, "lepe": 45, "ayamonte": 45, "isla cristina": 45,
      "moguer": 45, "palos de la frontera": 45, "palos": 45, "aracena": 45, "almonte": 45,
      "nijar": 45, "vicar": 45, "berja": 45, "adra": 45, "carboneras": 45,
      "mojacar": 45, "vera": 45, "guadix": 45, "baza": 45, "loja": 45,
      "almuñecar": 45, "salobreña": 45, "san roque": 55, "la linea de la concepcion": 55, "la linea": 55,
      "los barrios": 55, "san pedro alcantara": 55, "manilva": 55, "rincon de la victoria": 55, "cartaya": 55,
      "punta umbria": 55, "alcala la real": 55, "alcala de los gazules": 65, "castellar de la frontera": 65, "jimena de la frontera": 65,
      "trebujena": 65, "chipiona": 65, "setenil de las bodegas": 85, "setenil": 85, "zahara de la sierra": 85,
      "zahara": 85, "vejer de la frontera": 85, "vejer": 85, "medina sidonia": 85, "medina-sidonia": 85,
      "algodonales": 85, "el bosque": 85, "bosque": 85, "benaojan": 85, "juzcar": 85,
      "casares": 85, "frigiliana": 85, "comares": 85, "alora": 85, "ardales": 85,
      "teba": 85, "estepa": 85, "la roda de andalucia": 85, "roda de andalucia": 85, "herrera": 85,
      "pruna": 85, "el saucejo": 85, "saucejo": 85, "alanis": 85, "alanis de la sierra": 85,
      "san nicolas del puerto": 85, "almaden de la plata": 85, "el ronquillo": 85, "ronquillo": 85, "guillena": 85,
      "gerena": 85, "aznalcollar": 85, "aznalcazar": 85, "bollullos par del condado": 85, "bollullos": 85,
      "la palma del condado": 85, "palma del condado": 85, "zalamea la real": 85, "zalamea": 85, "minas de riotinto": 85,
      "riotinto": 85, "jabugo": 85, "cortegana": 85, "galaroza": 85, "almonaster la real": 85,
      "segura de la sierra": 85, "siles": 85, "torres": 85, "jodar": 85, "huelma": 85,
      "baena": 85, "rute": 85, "zuheros": 85, "ilora": 85, "montefrio": 85,
      "alhama de granada": 85, "alhama": 85, "trevelez": 85, "capileira": 85, "pampaneira": 85,
      "bubion": 85, "orgiva": 85, "sorbas": 85, "tabernas": 85, "velez-rubio": 85,
      "velez rubio": 85, "velez-blanco": 85, "velez blanco": 85, "gergal": 85, "castilblanco de los arroyos": 100,
      "castilblanco": 100, "el pedroso": 100, "pedroso": 100, "villanueva del rio y minas": 100, "villanueva del rio": 100,
      "lantejuela": 100, "la lantejuela": 100, "badolatosa": 100, "coripe": 100, "algamitas": 100,
      "carmonita": 100, "macharaviaya": 100, "salares": 100, "sedella": 100, "canillas de aceituno": 100,
      "canillas de albaida": 100, "benarraba": 100, "benadalid": 100, "alpandeire": 100, "cartajima": 100,
      "farajan": 100, "jubrique": 100, "pujerra": 100, "genalguacil": 100, "igualeja": 100,
      "carchel": 100, "carcheles": 100, "noalejo": 100, "albanchez de magina": 100, "albanchez": 100,
      "belmez de la moraleda": 100, "cabra del santo cristo": 100, "higuera de calatrava": 100, "santiago de calatrava": 100, "larva": 100,
      "villarrodrigo": 100, "hornos": 100, "hornos de segura": 100, "orce": 100, "galera": 100,
      "castillejar": 100, "castril": 100, "puebla de don fadrique": 100, "gobernador": 100, "morelabor": 100,
      "darro": 100, "la calahorra": 100, "calahorra": 100, "almegijar": 100, "busquistar": 100,
      "bayarcal": 100, "alcudia de monteagud": 100, "benitagla": 100, "velefique": 100, "senes": 100,
      "sufli": 100, "laroya": 100, "chercos": 100, "cobdar": 100, "lijar": 100,
      "paradas": 100, "marinaleda": 100, "olivera": 100, "olvera": 100, "villamartin": 100,
      "bornos": 100, "espera": 100, "prado del rey": 100, "el gastor": 100, "gastor": 100,
      "puerto serrano": 100, "torre alhaquime": 100, "alcala del valle": 100, "benalup": 100, "benalup-casas viejas": 100,
      "paterna de rivera": 100, "san jose del valle": 100
    }
  },
  {
    id: "geo-010", dailyId: "dia11-01", pack: "geografia",
    texto: "Río o afluente principal de la península ibérica",
    ejemplo: "guadalquivir",
    answers: {}
  },
  {
    id: "geo-011", dailyId: "dia12-03", pack: "geografia",
    texto: "Cabo, ría, golfo o bahía del litoral español",
    ejemplo: "cabo de gata",
    answers: {
      /* 10 pts - Los más evidentes y estudiados a nivel escolar */
      "cabo de gata": 10, "gata": 10, "cabo de palos": 10, "palos": 10,
      "cabo de finisterre": 10, "finisterre": 10, "cabo de peñas": 10, "peñas": 10,
      "cabo de creus": 10, "creus": 10, "cap de creus": 10, "golfo de cadiz": 10,
      "golfo de vizcaya": 10, "ria de vigo": 10, "ria de arousa": 10, "ria de arosa": 10,
      "bahia de cadiz": 10, "bahia de santander": 10, "cabo trafalgar": 10, "trafalgar": 10,
      /* 25 pts - Cabos principales, rías gallegas mayores y golfos reconocidos */
      "cabo de la nao": 25, "la nao": 25, "cabo de san antonio": 25, "cabo san antonio": 25,
      "cabo de ajo": 25, "cabo ajo": 25, "cabo machichaco": 25, "cabo matxitxako": 25,
      "cabo fisterra": 25, "cabo de san vicente": 25, "cabo oriol": 25, "golfo de valencia": 25,
      "golfo de rosas": 25, "golfo de roses": 25, "golfo de almeria": 25, "bahia de algeciras": 25,
      "bahia de palma": 25, "bahia de malaga": 25, "ria de pontevedra": 25, "ria de betanzos": 25,
      "ria de ferrol": 25, "ria de la coruña": 25, "ria da coruña": 25, "ria de bilbao": 25,
      "ria de aviles": 25,
      /* 45 pts - Litoral cantábrico, atlántico y mediterráneo intermedio */
      "cabo de tortosa": 45, "cabo cope": 45, "cabo salou": 45, "cabo cervera": 45,
      "cabo santa pola": 45, "cabo de santa pola": 45, "cabo tiñoso": 45, "cabo silleiro": 45,
      "cabo corrubedo": 45, "cabo villano": 45, "cabo vilan": 45, "cabo touriñan": 45,
      "cabo tourinan": 45, "cabo vidio": 45, "cabo busto": 45, "cabo de torres": 45,
      "cabo mayor": 45, "cabo quintres": 45, "cabo higuer": 45, "ria de muros y noia": 45,
      "ria de cedeira": 45, "ria de ortigueira": 45, "ria de ribadeo": 45, "ria del eo": 45,
      "ria de villaviciosa": 45, "ria de tina mayor": 45, "ria de tina menor": 45, "ria de san vicente": 45,
      "ria de suances": 45,
      /* 65 pts - Bahías y golfos secundarios */
      "bahia de alcudia": 65, "bahia de pollensa": 65, "bahia de gijon": 65, "bahia de rosas": 65,
      "golfo de mazaron": 65, "golfo de mazarron": 65, "golfo de sant jordi": 65,
      /* 85 pts - Puntas, ensenadas, calas abiertas y cabos secundarios */
      "cabo pinar": 85, "cabo formentor": 85, "formentor": 85, "cabo ses salines": 85,
      "cabo blanco": 85, "cabo llebeig": 85, "cabo barbaria": 85, "cap de barbaria": 85,
      "cabo falconera": 85, "cabo san carles": 85, "cabo berenguer": 85, "cabo huertas": 85,
      "cabo de las huertas": 85, "cabo roig": 85, "cabo de aguas": 85, "cabo negrete": 85,
      "punta falconera": 85, "punta de la mona": 85, "punta entinas": 85, "punta carnero": 85,
      "punta de tarifa": 85, "punta candor": 85, "cabo de lastres": 85, "cabo mar": 85,
      "cabo san lorenzo": 85, "cabo bocal": 85, "ria de foz": 85, "ria de viveiro": 85,
      "ria del barquero": 85, "ria de lires": 85, "ria de camariñas": 85, "ria de corme y laxe": 85,
      "ria de esteiro": 85, "bahia de portmany": 85, "bahia de palamos": 85, "bahia de llucmajor": 85,
      /* 100 pts - AGENTE DURMIENTE / Puntas litorales de escala local y rías menores */
      "cabo prior": 100, "cabo priorino": 100, "cabo prioriño": 100, "punta da vaca": 100,
      "punta do castelo": 100, "punta frouxeira": 100, "punta langosteira": 100, "cabo llanse": 100,
      "cabo norfeu": 100, "punta de s'agulla": 100, "punta de la mora": 100, "cabo de cullera": 100,
      "punta prima": 100, "punta del morro": 100, "punta de la chullera": 100, "punta sabinar": 100,
      "punta del fangar": 100, "punta de la banya": 100, "ria de aldan": 100, "ria de boa": 100,
      "ria de lorbe": 100, "ria de navia": 100, "ria de pravia": 100, "ria de ribadesella": 100,
      "ria de arriondas": 100, "ria de poo": 100, "ria de cabo mayor": 100, "bahia de fornells": 100,
      "bahia de cadaques": 100, "bahia de san anton": 100
    }
  },
  {
    id: "geo-012", dailyId: "dia12-04", pack: "geografia",
    texto: "Parque nacional o parque natural de España",
    ejemplo: "doñana",
    answers: {}
  },
  {
    id: "geo-013", dailyId: "dia13-07", pack: "geografia",
    texto: "Sierra o sistema montañoso de la península ibérica",
    ejemplo: "sierra nevada",
    answers: {}
  },
  {
    id: "geo-014", dailyId: "dia14-07", pack: "geografia",
    texto: "Gentilicio singular de una provincia, ciudad o pueblo español",
    ejemplo: "gaditano",
    answers: {}
  },

  /* ----- Dossier Geografía · Capítulo 3: Geopolítica, Fronteras y Relieve Internacional ----- */
  {
    id: "geo-015", dailyId: "dia15-06", pack: "geografia",
    texto: "País soberano que no tiene salida al mar (país interior sin costa)",
    ejemplo: "suiza",
    answers: {}
  },
  {
    id: "geo-016", dailyId: "dia16-01", pack: "geografia",
    texto: "Estado de los Estados Unidos o territorio federal relevante",
    ejemplo: "california",
    answers: {}
  },
  {
    id: "geo-017", dailyId: "dia16-04", pack: "geografia",
    texto: "Desierto, estepa o salar del mundo",
    ejemplo: "sahara",
    answers: {}
  },
  {
    id: "geo-018", dailyId: "dia17-05", pack: "geografia",
    texto: "Lago o masa de agua dulce interior del mundo",
    ejemplo: "titicaca",
    answers: {}
  },
  {
    id: "geo-019", dailyId: "dia18-06", pack: "geografia",
    texto: "País soberano cuyo nombre comience por una vocal",
    ejemplo: "alemania",
    answers: {}
  },
  {
    id: "geo-020", dailyId: "dia18-04", pack: "geografia",
    texto: "Territorio dependiente, región ultraperiférica o colonia del mundo",
    ejemplo: "groenlandia",
    answers: {}
  },
  {
    id: "geo-021", dailyId: "dia19-06", pack: "geografia",
    texto: "Canal, estrecho o paso marítimo estratégico internacional",
    ejemplo: "canal de suez",
    answers: {}
  },
  {
    id: "mus-001", dailyId: "dia5-02", pack: "musica",
    texto: "Instrumento musical de cuerda",
    ejemplo: "nyckelharpa",
    answers: {
      "guitarra": 10, "violin": 10, "piano": 10, "arpa": 10, "bajo": 10, "bajo electrico": 10, "bajoelectrico": 10, "guitarra electrica": 10, "guitarraelectrica": 10, "guitarra española": 10, "guitarraespañola": 10, "guitarra acustica": 10, "guitarraacustica": 10, "guitarra clasica": 10, "guitarraclasica": 10,
      "ukelele": 25, "ukulele": 25, "contrabajo": 25, "violonchelo": 25, "violoncelo": 25, "chelo": 25, "cello": 25, "laud": 25, "mandolina": 25, "voz": 25, "cuerdas vocales": 25, "cuerdasvocales": 25, "guitarra flamenca": 25, "guitarraflamenca": 25, "piano de cola": 25, "pianodecola": 25, "arpa celtica": 25,
      "viola": 45, "banjo": 45, "sitar": 45, "clavicordio": 45, "clave": 45, "clavecin": 45, "bandurria": 45, "vihuela": 45, "lira": 45, "balalaika": 45, "timple": 45, "timple canario": 45, "timplecanario": 45, "charango": 45, "citara": 45, "espineta": 45, "salterio": 45, "dulcimer": 45, "dulcemele": 45, "guitalele": 45, "tres cubano": 45, "trescubano": 45, "cuatro venezolano": 45, "cuatro": 45, "cavaquinho": 45, "cavaco": 45, "guitarron": 45, "requinto": 45,
      "guzheng": 65, "zheng": 65, "koto": 65, "erhu": 65, "buzuki": 65, "bouzouki": 65, "guitarro": 65, "shamisen": 65, "pipa": 65, "biwa": 65, "sanxian": 65, "gayageum": 65, "komungo": 65, "oud": 65, "ud": 65, "saz": 65, "baglama": 65, "tanbur": 65, "domra": 65, "dutar": 65, "rubab": 65, "rebab": 65, "morin khuur": 65, "morinkhuur": 65, "sarangi": 65, "sarod": 65, "veena": 65, "santur": 65, "kanun": 65, "cimbalom": 65, "pedal steel": 65, "lap steel": 65,
      "zanfona": 85, "zanfoña": 85, "hurdy gurdy": 85, "rabel": 85, "viola de gamba": 85, "violadegamba": 85, "viola da gamba": 85, "tiorba": 85, "laud renacentista": 85, "laudrenacentista": 85, "laud barroco": 85, "monocordio": 85, "kora": 85, "viola da braccio": 85, "viola de amor": 85, "viola d amore": 85, "trompeta marina": 85, "trompetamarina": 85, "citara de concierto": 85, "bandura": 85, "kobza": 85, "gusli": 85, "kantele": 85, "valiha": 85, "berimbau": 85, "tanpura": 85, "tar persa": 85,
      "nyckelharpa": 100, "chapman stick": 100, "chapmanstick": 100, "the stick": 100, "gravikord": 100, "yayli tanbur": 100, "yaylitanbur": 100, "clavicordio de pedal": 100, "clavicordiodepedal": 100, "hardingfele": 100, "violin de hardanger": 100, "esraj": 100, "dilruba": 100, "swarabat": 100, "kamancheh": 100, "kemenche": 100, "crwth": 100, "giga medieval": 100, "chitarra battente": 100, "archilaud": 100, "vihuela de arco": 100, "dan bau": 100, "kankles": 100, "kokle": 100, "ektara": 100
    }
  },
  {
    id: "mus-002", dailyId: "dia6-07", pack: "musica",
    texto: "Grupo, banda o cantante solista de la música española",
    ejemplo: "aviador dro",
    answers: {
      "rosalia": 10, "alejandro sanz": 10, "david bisbal": 10, "estopa": 10, "el canto del loco": 10, "mecano": 10, "heroes del silencio": 10,
      "fito y fitipaldis": 10, "extremoduro": 10, "julio iglesias": 10, "raphael": 10, "rocio jurado": 10, "camaron": 10, "paco de lucia": 10,
      "lola flores": 10, "joaquin sabina": 10, "joan manuel serrat": 10, "bisbal": 10, "canto del loco": 10, "fito": 10, "camaron de la isla": 10,
      "sabina": 10,
      "enrique iglesias": 25, "pablo alboran": 25, "aitana": 25, "lola indigo": 25, "melendi": 25, "dani martin": 25, "manuel carrasco": 25,
      "pablo lopez": 25, "vane martin": 25, "vanesa martin": 25, "malu": 25, "rozalen": 25, "antonio orozco": 25, "chenoa": 25,
      "bustamante": 25, "david bustamante": 25, "sergio dalma": 25, "miguel bose": 25, "bose": 25, "isabel pantoja": 25, "taburete": 25,
      "la oreja de van gogh": 45, "amaral": 45, "pereza": 45, "hombres g": 45, "alaska": 45, "fangoria": 45, "radio futura": 45,
      "nacha pop": 45, "los secretos": 45, "loquillo": 45, "mago de oz": 45, "vetusta morla": 45, "izal": 45, "love of lesbian": 45,
      "viva suecia": 45, "arde bogota": 45, "lori meyers": 45, "los planetas": 45, "supersubmarina": 45, "c tangana": 45, "quevedo": 45,
      "niña pastori": 45, "el barrio": 45, "oreja de van gogh": 45, "tangana": 45, "jarabe de palo": 45, "celtas cortos": 45, "duncan dhu": 45,
      "seguridad social": 45, "modestia aparte": 45, "danza invisible": 45, "la guardia": 45, "revolver": 45, "m clan": 45, "leiva": 45,
      "sidecars": 45, "miss caffeina": 45, "dorian": 45,
      "barricada": 65, "marea": 65, "la polla records": 65, "kortatu": 65, "ska p": 65, "kase o": 65, "violadores del verso": 65,
      "sfdk": 65, "toteking": 65, "nata y waor": 65, "natos y waor": 65, "delaossa": 65, "cruz cafune": 65, "ketama": 65,
      "triana": 65, "medina azahara": 65, "los delincuentes": 65, "mojinos escozios": 65, "doble v": 65, "platero y tu": 65, "la fuga": 65,
      "boikot": 65, "reincidentes": 65, "soziedad alkoholika": 65, "lendakaris muertos": 65, "eskorbuto": 65,
      "baron rojo": 85, "obus": 85, "nach": 85, "chambao": 85, "ojos de brujo": 85, "bebe": 85, "macaco": 85,
      "mala rodriguez": 85, "la mala rodriguez": 85, "falsalarma": 85, "hablando en plata": 85, "cpv": 85, "el club de los poetas violentos": 85, "7 notas 7 colores": 85,
      "mucho muchacho": 85, "ayax y prok": 85, "fernandocosta": 85, "hard gz": 85, "recycled j": 85, "rels b": 85, "bad gyal": 85,
      "yung beef": 85,
      "aviador dro": 100, "smash": 100, "maquina": 100, "los bravos": 100, "los brincos": 100, "los pequeniques": 100, "los relampagos": 100,
      "los sirex": 100, "los salvajes": 100, "lone star": 100, "asfalto": 100, "topo": 100, "leño": 100, "coz": 100
    }
  },
  {
    id: "mus-003", dailyId: "dia6-05", pack: "musica",
    texto: "Género, subgénero o estilo musical",
    ejemplo: "krautrock",
    answers: {
      "pop": 10, "rock": 10, "rap": 10, "hip hop": 10, "regueton": 10, "trap": 10, "electronica": 10, "techno": 10, "house": 10, "musica clasica": 10, "jazz": 10, "blues": 10, "heavy metal": 10, "punk": 10, "indie": 10, "flamenco": 10, "salsa": 10, "bachata": 10, "reggae": 10, "reggaeton": 10, "musica electronica": 10, "clasica": 10,
      "musica": 25, "cancion": 25, "baile": 25, "concierto": 25, "festival": 25, "banda sonora": 25, "bs": 25, "radio": 25, "spotify": 25, "autotune": 25, "remix": 25, "acustico": 25, "instrumental": 25, "karaoke": 25, "balada": 25, "lenta": 25, "romantica": 25, "verano": 25, "cancion del verano": 25, "navidad": 25,
      "sevillanas": 45, "rumba": 45, "copla": 45, "merengue": 45, "cumbia": 45, "tango": 45, "bossa nova": 45, "samba": 45, "ska": 45, "dubstep": 45, "drum and bass": 45, "trance": 45, "disco": 45, "funk": 45, "soul": 45, "r b": 45, "gospel": 45, "country": 45, "folk": 45, "grunge": 45, "hard rock": 45, "punk rock": 45, "kpop": 45, "jpop": 45, "corridos": 45, "ranchera": 45, "bolero": 45, "pasodoble": 45, "zarzuela": 45, "opera": 45, "gregoriano": 45, "drill": 45, "dembow": 45, "afrobeat": 45, "lo fi": 45, "r and b": 45, "k pop": 45, "j pop": 45,
      "ambient": 65, "synthwave": 65, "thrash metal": 65, "death metal": 65, "black metal": 65, "nu metal": 65, "metalcore": 65, "post punk": 65, "new wave": 65, "shoegaze": 65, "britpop": 65, "corridos tumbados": 65, "vallenato": 65, "mariachi": 65, "son cubano": 65, "mambo": 65, "cha cha cha": 65, "chachacha": 65, "guaracha": 65, "champeta": 65, "cuarteto": 65, "zamba": 65, "chacarera": 65, "joropo": 65, "fado": 65, "chanson": 65, "polka": 65, "vals": 65,
      "power metal": 85, "doom metal": 85, "sludge metal": 85, "stoner rock": 85, "stoner metal": 85, "progressive metal": 85, "metal progresivo": 85, "symphonic metal": 85, "metal sinfonico": 85, "folk metal": 85, "viking metal": 85, "pagan metal": 85, "groove metal": 85, "industrial metal": 85, "metal industrial": 85, "deathcore": 85, "grindcore": 85, "djent": 85, "glam metal": 85, "hair metal": 85,
      "krautrock": 100, "zeuhl": 100, "canterbury scene": 100, "rock in opposition": 100, "no wave": 100, "witch house": 100, "seapunk": 100, "future funk": 100, "mallsoft": 100, "dungeon synth": 100, "blackgaze": 100, "dsbm": 100, "war metal": 100, "goregrind": 100
    }
  },
  {
    id: "mus-004", dailyId: "dia7-02", pack: "musica",
    texto: "Banda o solista legendario de música internacional (Rock, Pop, Urbano, Electrónica)",
    ejemplo: "captain beefheart",
    answers: {
      "the beatles": 10, "beatles": 10, "queen": 10, "michael jackson": 10, "madonna": 10, "elvis presley": 10, "rolling stones": 10, "acdc": 10, "metallica": 10, "nirvana": 10, "pink floyd": 10, "led zeppelin": 10, "u2": 10, "coldplay": 10, "eminem": 10, "beyonce": 10, "rihanna": 10, "lady gaga": 10, "taylor swift": 10, "shakira": 10, "bad bunny": 10, "los beatles": 10,
      "justin bieber": 25, "ariana grande": 25, "dua lipa": 25, "billie eilish": 25, "harry styles": 25, "one direction": 25, "sam smith": 25, "sia": 25, "miley cyrus": 25, "selena gomez": 25, "katy perry": 25, "britney spears": 25, "christina aguilera": 25, "backstreet boys": 25, "spice girls": 25, "justin timberlake": 25, "shawn mendes": 25, "camila cabello": 25, "olivia rodrigo": 25, "post malone": 25,
      "oasis": 45, "blur": 45, "radiohead": 45, "muse": 45, "arctic monkeys": 45, "the strokes": 45, "red hot chili peppers": 45, "green day": 45, "blink 182": 45, "linkin park": 45, "system of a down": 45, "iron maiden": 45, "black sabbath": 45, "judas priest": 45, "guns n roses": 45, "bon jovi": 45, "aerosmith": 45, "dire straits": 45, "the police": 45, "david bowie": 45, "elton john": 45, "freddie mercury": 45, "bob dylan": 45, "bruce springsteen": 45, "bob marley": 45, "abba": 45, "bee gees": 45, "depeche mode": 45, "the cure": 45, "ramones": 45, "daft punk": 45, "bruno mars": 45, "the weeknd": 45, "ed sheeran": 45, "adele": 45, "amy winehouse": 45, "frank sinatra": 45, "daddy yankee": 45,
      "joy division": 65, "sex pistols": 65, "the clash": 65, "tupac": 65, "snoop dogg": 65, "jay z": 65, "kanye west": 65, "drake": 65, "kendrick lamar": 65, "aretha franklin": 65, "stevie wonder": 65, "prince": 65, "whitney houston": 65, "luis miguel": 65, "soda stereo": 65, "2pac": 65, "the doors": 65, "jimi hendrix": 65, "janis joplin": 65, "the who": 65, "deep purple": 65, "motorhead": 65, "slayer": 65, "megadeth": 65, "pantera": 65, "slipknot": 65, "korn": 65, "rage against the machine": 65,
      "notorious big": 85, "biggie": 85, "nas": 85, "wu tang clan": 85, "public enemy": 85, "nwa": 85, "ice cube": 85, "dr dre": 85, "eazy e": 85, "run dmc": 85, "beastie boys": 85, "a tribe called quest": 85, "de la soul": 85, "outkast": 85, "lauryn hill": 85, "fugees": 85, "missy elliott": 85, "busta rhymes": 85, "50 cent": 85,
      "captain beefheart": 100, "frank zappa": 100, "the mothers of invention": 100, "the residents": 100, "pere ubu": 100, "this heat": 100, "throbbing gristle": 100, "cabaret voltaire": 100, "coil": 100, "einsturzende neubauten": 100, "laibach": 100, "swans": 100, "godspeed you black emperor": 100, "sigur ros": 100
    }
  },
  {
    id: "mus-005", dailyId: "dia8-01", pack: "musica",
    texto: "Instrumento musical de viento o de percusión",
    ejemplo: "armonica de cristal",
    answers: {
      "bateria": 10, "tambor": 10, "flauta": 10, "saxofon": 10, "trompeta": 10, "clarinete": 10, "trombon": 10, "tuba": 10, "oboe": 10, "fagot": 10, "flauta travesera": 10, "flauta dulce": 10, "armonica": 10, "acordeon": 10, "gaita": 10, "xilofono": 10, "bombo": 10, "platillos": 10, "triangulo": 10, "pandereta": 10, "castañuelas": 10, "maracas": 10,
      "guitarra": 25, "piano": 25, "violin": 25, "arpa": 25, "bajo": 25, "ukelele": 25, "violonchelo": 25, "contrabajo": 25, "laud": 25, "mandolina": 25, "banjo": 25, "voz": 25, "microfono": 25, "altavoz": 25, "amplificador": 25, "baquetas": 25, "batuta": 25, "atril": 25, "partitura": 25, "diapason": 25,
      "piccolo": 45, "flautin": 45, "ocarina": 45, "zampoña": 45, "quena": 45, "didgeridoo": 45, "corneta": 45, "trompa": 45, "corno frances": 45, "corno ingles": 45, "bombardino": 45, "marimba": 45, "vibrafono": 45, "carillon": 45, "timbales": 45, "caja": 45, "charles": 45, "hi hat": 45, "gong": 45, "pandero": 45, "claves": 45, "guiro": 45, "bongos": 45, "congas": 45, "tumbadoras": 45, "cajon flamenco": 45, "djembe": 45, "cencerro": 45, "kalimba": 45, "campanas tubulares": 45, "organo": 45, "timbal": 45, "bongo": 45, "conga": 45, "cajon": 45, "yembe": 45, "kazoo": 45, "melodica": 45,
      "bugle": 65, "helicon": 65, "sousafon": 65, "glockenspiel": 65, "tam tam": 65, "darbuka": 65, "taiko": 65, "cabasa": 65, "hang": 65, "handpan": 65, "celesta": 65, "lira": 65, "fliscorno": 65, "cornetto": 65, "serpenton": 65, "oficleido": 65, "cromorno": 65, "chirimia": 65, "dulzaina": 65, "gralla": 65, "tenora": 65, "tible": 65, "flabiol": 65, "txistu": 65, "tamboril": 65, "alboka": 65, "xirula": 65, "gaita gallega": 65,
      "saxofon soprano": 85, "saxofon alto": 85, "saxofon tenor": 85, "saxofon baritono": 85, "saxofon bajo": 85, "clarinete bajo": 85, "clarinete requinto": 85, "contrafagot": 85, "oboe de amor": 85, "flauta alto": 85, "flauta bajo": 85, "trombon bajo": 85, "trompeta piccolo": 85, "trompeta pocket": 85, "tuba wagneriana": 85, "eufonio": 85, "sarrusofon": 85, "heckelphon": 85, "tarogato": 85, "shakuhachi": 85,
      "armonica de cristal": 100, "subcontrabajo": 100, "octocontrabajo": 100, "flauta hiperbaja": 100, "tubax": 100, "aulocromo": 100, "saxello": 100, "conn o sax": 100, "rothphone": 100, "sudrophone": 100, "boehm": 100, "ophicleide": 100, "cimbasso": 100, "buccin": 100
    }
  },
  {
    id: "mus-006", dailyId: "dia9-05", pack: "musica",
    texto: "Canción legendaria o himno popular en español",
    ejemplo: "dulce introduccion al caos",
    answers: {
      "la macarena": 10, "macarena": 10, "despacito": 10, "la flaca": 10, "flaca": 10, "corazon partio": 10, "el tractor amarillo": 10, "tractor amarillo": 10, "asereje": 10, "el asereje": 10, "devuelveme a mi chica": 10, "sufre mamon": 10, "ave maria": 10, "libre": 10, "soldadito marinero": 10, "la barbacoa": 10, "barbacoa": 10, "mi gran noche": 10, "vivir asi es morir de amor": 10, "bailando": 10, "resistire": 10, "paquito el chocolatero": 10,
      "quedate": 25, "bzrp music sessions 52": 25, "despecha": 25, "malamente": 25, "mala mujer": 25, "tu me dejaste de querer": 25, "demasiadas mujeres": 25, "tacones rojos": 25, "mon amour": 25, "todo de ti": 25, "la bicicleta": 25, "waka waka": 25, "bailando por ahi": 25, "el perdon": 25, "suavemente": 25, "torero": 25, "buleria": 25, "la bomba": 25, "el tiburon": 25, "mayonesa": 25,
      "chiquilla": 45, "borrachera": 45, "bonita": 45, "un beso y una flor": 45, "cruz de navajas": 45, "cuentame": 45, "lobo hombre en paris": 45, "aqui no hay playa": 45, "la chica de ayer": 45, "chica de ayer": 45, "salto mortal": 45, "noche de bohemia": 45, "sarandonga": 45, "camarera de mi amor": 45, "volando voy": 45, "soy minero": 45, "amores de barra": 45, "el fin del mundo": 45, "hoy no me puedo levantar": 45, "hijo de la luna": 45, "maquillaje": 45, "barco a venus": 45, "me cole en una fiesta": 45, "la raja de tu falda": 45, "por la raja de tu falda": 45, "como camaron": 45, "zapatillas": 45, "una foto en blanco y negro": 45, "la madre de jose": 45, "besos": 45, "princesas": 45, "rosas": 45, "la playa": 45, "puedes contar conmigo": 45, "20 de abril": 45, "veinte de abril": 45, "sin documentos": 45, "por la boca vive el pez": 45,
      "so payaso": 65, "dolor y gloria": 65, "salir": 65, "jesucristo garcia": 65, "la vereda de la puerta de atras": 65, "antes de que cuente diez": 65, "la casa por el tejado": 65, "entre dos tierras": 65, "maldito duende": 65, "la chispa adecuada": 65, "cadillac solitario": 65, "veneno en la piel": 65, "escuela de calor": 65, "en algun lugar": 65, "cien gaviotas": 65, "dejame": 65, "pero a tu lado": 65, "santa lucia": 65, "insurreccion": 65, "carolina": 65, "a quien le importa": 65, "sobrevivire": 65, "bailar pegados": 65, "corazon espinado": 65, "la camisa negra": 65, "bamboleo": 65, "entre dos aguas": 65, "la leyenda del tiempo": 65,
      "mediterraneo": 85, "19 dias y 500 noches": 85, "y nos dieron las diez": 85, "princesa": 85, "pongamos que hablo de madrid": 85, "no dudaria": 85, "al alba": 85, "como una ola": 85, "se nos rompio el amor": 85, "yo soy aquel": 85, "escandalo": 85, "como yo te amo": 85, "eva maria": 85, "un rayo de sol": 85, "el baul de los recuerdos": 85, "copenhague": 85, "valiente": 85, "la mujer de verde": 85, "copacabana": 85, "turnedo": 85,
      "dulce introduccion al caos": 100, "quiero ser santa": 100, "autosuficiencia": 100, "el acto": 100, "maneras de vivir": 100, "flojo de pantalon": 100, "resistire baron rojo": 100, "los rockeros van al infierno": 100, "preparado para el rock and roll": 100, "en blanco y negro": 100, "no hay tregua": 100, "el roce de tu cuerpo": 100, "fiesta pagana": 100, "molinos de viento": 100
    }
  },
  {
    id: "mus-007", dailyId: "dia9-03", pack: "musica",
    texto: "Festival de música multitudinario (España o internacional)",
    ejemplo: "watkins glen",
    answers: {
      "viña rock": 10, "viñarock": 10, "el viña rock": 10, "primavera sound": 10, "el primavera sound": 10, "mad cool": 10, "el mad cool": 10, "arenal sound": 10, "arenasound": 10, "festival de benicassim": 10, "fib": 10, "benicassim": 10, "resurrection fest": 10, "resu": 10, "dreambeach": 10, "medusa festival": 10, "medusa": 10, "sonorama": 10, "bbk live": 10, "coachella": 10, "tomorrowland": 10, "eurovision": 10,
      "el viña": 25, "bilbao bbk live": 25, "bbk": 25, "sonorama ribera": 25, "festival de eurovision": 25, "benidorm fest": 25, "festival de benidorm": 25, "reggaeton beach festival": 25, "rbf": 25, "puro latino": 25, "boombastic": 25, "starlite": 25, "starlite marbella": 25, "sonar": 25, "festival sonar": 25, "cruilla": 25, "canet rock": 25, "monegros": 25, "monegros desert festival": 25,
      "rototom": 45, "rototom sunsplash": 45, "leyendas del rock": 45, "glastonbury": 45, "lollapalooza": 45, "rock in rio": 45, "burning man": 45, "woodstock": 45, "wacken": 45, "wacken open air": 45, "hellfest": 45, "ultra music festival": 45, "ultra": 45, "umf": 45, "sziget": 45, "creamfields": 45, "time warp": 45, "defqon 1": 45, "monterey": 45, "download": 45, "download festival": 45, "azkena rock": 45, "azkena rock festival": 45, "tsunami xixon": 45, "o son do camiño": 45, "son do camiño": 45, "portamerica": 45, "caudal fest": 45, "morriña fest": 45, "low festival": 45, "warm up": 45, "san san festival": 45, "sansan": 45, "granada sound": 45, "cala mijas": 45, "dcode": 45, "rio babel": 45, "tomavistas": 45,
      "aquasella": 65, "elrow": 65, "awakenings": 65, "mysteryland": 65, "decibel": 65, "qlimax": 65, "dominator": 65, "edc": 65, "electric daisy carnival": 65, "riverland": 65, "holika": 65, "zlive": 65, "rock imperium": 65, "barcelona rock fest": 65, "rock fest": 65, "vida festival": 65, "cap roig": 65, "concert music festival": 65, "kalorama": 65, "contempopranea": 65, "etnosur": 65, "ortigueira": 65, "festival de ortigueira": 65, "pirineos sur": 65, "extremusika": 65, "alrumbo": 65, "sos 4 8": 65, "en vivo": 65,
      "reading": 85, "leeds": 85, "reading and leeds": 85, "isle of wight": 85, "isla de wight": 85, "wireless": 85, "roskilde": 85, "rock am ring": 85, "rock im park": 85, "rock werchter": 85, "werchter": 85, "pinkpop": 85, "pukkelpop": 85, "lowlands": 85, "graspop": 85, "brutal assault": 85, "bloodstock": 85, "summer breeze": 85, "monsters of rock": 85, "ozzfest": 85,
      "watkins glen": 100, "altamont": 100, "us festival": 100, "monterey pop festival": 100, "live aid": 100, "live 8": 100, "warped tour": 100, "knotfest": 100, "bonnaroo": 100, "austin city limits": 100, "sxsw": 100, "fuji rock": 100, "vive latino": 100, "festival de viña del mar": 100
    }
  },
  {
    id: "mus-008", dailyId: "dia10-05", pack: "musica",
    texto: "Grupo, banda o artista solista de K-pop (pop coreano)",
    ejemplo: "seo taiji and boys",
    answers: {
      "bts": 10, "blackpink": 10, "black pink": 10, "newjeans": 10, "new jeans": 10, "txt": 10, "tomorrow x together": 10,
      "seventeen": 10, "svt": 10, "psy": 10, "exo": 10, "red velvet": 10, "redvelvet": 10, "aespa": 10,
      "itzy": 10, "ive": 10, "enhypen": 10, "ateez": 10,
      "twice": 25, "stray kids": 25, "straykids": 25, "skz": 25, "le sserafim": 25, "lesserafim": 25, "nct": 25,
      "nct 127": 25, "nct dream": 25, "illit": 25, "stayc": 25, "got7": 25, "bigbang": 25, "big bang": 25,
      "super junior": 25, "suju": 25, "shinee": 25, "girls generation": 25, "snsd": 25, "2ne1": 25, "babymonster": 25,
      "jungkook": 25, "iu": 25,
      "mamamoo": 45, "monsta x": 45, "monstax": 45, "treasure": 45, "nmixx": 45, "the boyz": 45, "theboyz": 45,
      "astro": 45, "dreamcatcher": 45, "infinite": 45, "btob": 45, "winner": 45, "ikon": 45, "highlight": 45,
      "beast": 45, "kard": 45, "loona": 45, "kep1er": 45, "kepler": 45, "fifty fifty": 45, "fiftyfifty": 45,
      "riize": 45, "boynextdoor": 45, "boy next door": 45, "zerobaseone": 45, "zb1": 45, "kiss of life": 45, "everglow": 45,
      "taeyeon": 45, "g dragon": 45, "gdragon": 45, "sunmi": 45, "hyuna": 45, "chungha": 45, "ailee": 45,
      "somi": 45, "wonho": 45, "kang daniel": 45, "taemin": 45,
      "block b": 65, "blockb": 65, "bap": 65, "b a p": 65, "vixx": 65, "cnblue": 65, "ft island": 65,
      "tvxq": 65, "dbsk": 65, "wonder girls": 65, "kara": 65, "t ara": 65, "tara": 65, "4minute": 65,
      "miss a": 65, "sistar": 65, "apink": 65, "exid": 65, "nuest": 65, "pentagon": 65, "victon": 65,
      "cravity": 65, "p1harmony": 65, "tempest": 65, "xikers": 65, "triples": 65, "triple s": 65, "billlie": 65,
      "hot": 85, "h o t": 85, "sechskies": 85, "ses": 85, "s e s": 85, "finkl": 85, "fin k l": 85,
      "shinhwa": 85, "god": 85, "g o d": 85, "fly to the sky": 85, "turbo": 85, "baby vox": 85, "chakra": 85,
      "jewelry": 85, "brown eyed girls": 85, "after school": 85, "orange caramel": 85, "rainbow": 85, "secret": 85,
      "seo taiji and boys": 100, "seo taiji": 100, "roora": 100, "r oo ra": 100, "koyote": 100, "untitle": 100, "diva": 100,
      "cleo": 100, "ttma": 100, "papaya": 100, "milk": 100, "sugar": 100, "shinvi": 100, "luv": 100
    }
  },
  /* ----- Dossier Música · Capítulo 2: Escena Urbana, Vanguardia y Electrónica (Continuación mus-009 a mus-014) ----- */
  {
    id: "mus-009", dailyId: "dia11-06", pack: "musica",
    texto: "Cantante o referente de música urbana, reggaetón o trap en español",
    ejemplo: "bad bunny",
    answers: {}
  },
  {
    id: "mus-010", dailyId: "dia11-07", pack: "musica",
    texto: "Rapero, MC o grupo de hip hop (español o internacional)",
    ejemplo: "kase o",
    answers: {}
  },
  {
    id: "mus-011", dailyId: "dia12-01", pack: "musica",
    texto: "Productor o DJ de música electrónica",
    ejemplo: "david guetta",
    answers: {}
  },
  {
    id: "mus-012", dailyId: "dia13-04", pack: "musica",
    texto: "Canción histórica o representante de España en Eurovisión",
    ejemplo: "eres tu",
    answers: {}
  },
  {
    id: "mus-013", dailyId: "dia13-03", pack: "musica",
    texto: "Grupo o banda histórica de heavy metal, rock duro o punk",
    ejemplo: "iron maiden",
    answers: {}
  },
  {
    id: "mus-014", dailyId: "dia14-02", pack: "musica",
    texto: "Banda o artista de la Movida Madrileña o del pop español de los 80/90",
    ejemplo: "radio futura",
    answers: {}
  },

  /* ----- Dossier Música · Capítulo 3: Tradición, Clásicos y Teoría Sonora ----- */
  {
    id: "mus-015", dailyId: "dia15-01", pack: "musica",
    texto: "Compositor célebre de música clásica, barroca o romántica",
    ejemplo: "mozart",
    answers: {}
  },
  {
    id: "mus-016", dailyId: "dia16-02", pack: "musica",
    texto: "Término musical reglamentario (tempo, escala, notación o dinámica)",
    ejemplo: "allegro",
    answers: {}
  },
  {
    id: "mus-017", dailyId: "dia16-06", pack: "musica",
    texto: "Álbum o disco histórico de la música española o internacional",
    ejemplo: "thriller",
    answers: {}
  },
  {
    id: "mus-018", dailyId: "dia17-02", pack: "musica",
    texto: "Dúo musical o formación compuesta por hermanos o familiares",
    ejemplo: "estopa",
    answers: {}
  },
  {
    id: "mus-019", dailyId: "dia18-05", pack: "musica",
    texto: "Cantaor, guitarrista o figura legendaria del flamenco",
    ejemplo: "camaron de la isla",
    answers: {}
  },
  {
    id: "mus-020", dailyId: "dia19-03", pack: "musica",
    texto: "Palo tradicional o estilo del cante y baile flamenco",
    ejemplo: "bulerias",
    answers: {}
  },
  {
    id: "mus-021", dailyId: "dia19-07", pack: "musica",
    texto: "Banda británica legendaria de las décadas de 1960 a 2000",
    ejemplo: "the beatles",
    answers: {}
  },

  /* ===================== DÍA 4: OPERACIÓN CUADRANTE (dia4-01 a dia4-07) ===================== */
  {
    id: "gen-027", dailyId: "dia4-01", pack: "general",
    texto: "País o territorio soberano que tenga un sol en su bandera",
    ejemplo: "argentina",
    easterEgg: "malaui",
    answers: {
      "malaui": 45, "argentina": 10, "uruguay": 10, "japon": 10,
      "filipinas": 10, "taiwan": 10, "el japon": 10, "la argentina": 10,
      "el uruguay": 10, "las filipinas": 10, "nepal": 25, "macedonia del norte": 25,
      "macedonia": 25, "kazajistan": 25, "kirguistan": 25, "namibia": 25,
      "ruanda": 25, "bangladesh": 25, "mongolia": 25, "india": 25,
      "niger": 25, "antigua y barbuda": 25, "palaos": 25, "islas marshall": 25,
      "republica de macedonia del norte": 25, "republica de macedonia": 25, "el nepal": 25, "el kazajistan": 25,
      "la india": 25, "el tibet": 25, "tibet": 25, "groenlandia": 25,
      "malawi": 45, "kurdistan": 45, "arizona": 45, "nuevo mexico": 45,
      "republica de palaos": 45, "republica de las islas marshall": 45, "republica de kazajistan": 45, "republica kirguisa": 45,
      "republica de namibia": 45, "republica de ruanda": 45, "republica oriental del uruguay": 45, "republica argentina": 45,
      "republica de china": 45, "republica de china taiwan": 45, "republica de filipinas": 45, "republica de la india": 45,
      "republica popular de bangladesh": 45, "islas canarias": 45, "canarias": 45, "estado de japon": 45,
      "republica de vanuatu": 45, "vanuatu": 45, "kiribati": 65, "republica de kiribati": 65,
      "moldavia": 65, "republica de moldavia": 65, "angola": 65, "republica de angola": 65,
      "ecuador": 65, "republica del ecuador": 65, "costa rica": 65, "republica de costa rica": 65,
      "el salvador": 65, "republica de el salvador": 65, "bolivia": 65, "estado plurinacional de bolivia": 65,
      "colombia": 65, "republica de colombia": 65, "republica dominicana": 65, "la republica dominicana": 65,
      "guatemala": 65, "republica de guatemala": 65, "paraguay": 65, "republica del paraguay": 65,
      "venezuela": 65, "republica bolivariana de venezuela": 65, "malasia": 65, "federacion de malasia": 65,
      "sudamerica": 65, "imperio de japon": 65, "republica de mongolia": 65, "tibetano": 65,
      "isla de pascua": 65, "rapa nui": 65, "antigua barbuda": 85,
      "marshall islands": 85, "marshall": 85, "republica de china en taiwan": 85, "republica de malaui": 85,
      "republica de malawi": 85, "republica del niger": 85, "republica democratica de congo": 85, "republica democratica del congo": 85,
      "republica de zambia": 85, "zambia": 85, "sahara occidental": 85, "republica arabe saharaui democratica": 85,
      "republica del kurdistan": 85, "kurdistan iraqui": 85, "rojava": 85, "kurdistan sirio": 85,
      "estado de arizona": 85, "estado de nuevo mexico": 85, "bandera de arizona": 85, "bandera de nuevo mexico": 85,
      "comunidad autonoma de canarias": 85, "archipielago canario": 85, "republica de biafra": 100, "biafra": 100,
      "imperio inca": 100, "imperio incaico": 100, "tahuantinsuyo": 100, "republica de china de 1912": 100,
      "republica de formosa": 100, "imperio persa": 100, "persia": 100, "imperio mogol": 100,
      "manchuria": 100, "manchukuo": 100, "republica de ezo": 100, "republica de vermont": 100,
      "republica de california": 100, "republica del rio grande": 100, "bandera del sol naciente": 65, "islas baleares": 85,
      "republica de yucatan": 100, "sol naciente": 65, "tatarstan": 85, "bandera de yucatan": 100,
      "sol de mayo": 65, "republica de tatarstan": 85, "confederacion peruano boliviana": 100, "buriatia": 85,
      "provincias unidas del rio de la plata": 100, "republica de buriatia": 85, "provincias unidas de centroamerica": 100, "jakasia": 85,
      "republica federal de centroamerica": 100, "republica de jakasia": 85
    }
  },
  {
    id: "gen-028", dailyId: "dia4-02", pack: "general",
    texto: "Palabra común en español que contenga la letra «X»",
    ejemplo: "taxi",
    answers: {
      "taxi": 10, "examen": 10, "exito": 10, "oxigeno": 10, "sexo": 10, "texto": 10, "mixto": 10,
      "boxeo": 10, "flexo": 10, "galaxia": 10, "mexico": 10, "texas": 10,
      "proximo": 25, "exacto": 25, "exilio": 25, "experto": 25, "auxilio": 25, "conexion": 25, "toxico": 25,
      "lexico": 25, "reflejo": 25, "oxido": 25, "contexto": 25, "pretexto": 25, "exceso": 25, "excluir": 25,
      "existir": 25, "extintor": 25, "flexible": 25, "extra": 25, "extraño": 25, "explicar": 25, "exposicion": 25,
      "exterior": 25, "extremo": 25, "auxiliar": 25, "anexo": 25, "anexar": 25, "anexion": 25, "antrax": 25,
      "aproximadamente": 25, "auxiliador": 25,
      "asfixia": 45, "exactitud": 45, "exagerar": 45, "examinar": 45, "excavar": 45, "excelente": 45, "excepcion": 45,
      "exclamar": 45, "excursion": 45, "excusa": 45, "ejecutar": 45, "exhibir": 45, "exhortar": 45, "exigir": 45,
      "exitoso": 45, "exotico": 45, "expansion": 45, "expediente": 45, "experiencia": 45, "experimento": 45, "explorar": 45,
      "explosion": 45, "exportar": 45, "expresar": 45, "exprimir": 45, "expulsar": 45, "extender": 45, "extension": 45,
      "extranjero": 45, "extraordinario": 45, "extraviar": 45, "luxacion": 45, "maxilar": 45, "anafilaxia": 45, "anexionar": 45,
      "axial": 45, "axilar": 45, "axis": 45, "excelso": 45,
      "claxon": 65, "duplex": 65, "ortodoxo": 65, "paradoja": 65, "yuxtaponer": 65, "xenofobia": 65, "xilofono": 65,
      "exogamia": 65, "oxitocina": 65, "taxonomia": 65, "pixeles": 65, "sintaxis": 65, "flexibilizar": 65, "exoftalmia": 65,
      "aproximar": 65, "coexistir": 65, "desoxirribonucleico": 65, "exabrupto": 65, "exacerbar": 65, "exasperar": 65, "exhaustivo": 65,
      "exhibicion": 65, "exorcismo": 65, "exorcista": 65, "expatriado": 65, "expectativa": 65, "explanada": 65, "explayar": 65,
      "explicito": 65, "explotar": 65, "ambidextro": 65, "amplexo": 65, "anexionismo": 65, "anexionista": 65, "axon": 65,
      "exuvia": 85, "xantoma": 85, "anorexia": 85, "antoxantina": 85, "apoplejia": 85, "asfixiologo": 85, "ataxia": 85,
      "axila": 85, "axioma": 85, "axiomatico": 85, "bauxita": 85, "boxear": 85, "calix": 85, "caquexia": 85,
      "complexion": 85, "crucifijo": 85, "crucifixion": 85, "deixis": 85, "desintoxicar": 85, "dextrosa": 85, "dislexia": 85,
      "dislexico": 85, "epistaxis": 85, "exantema": 85, "excomunion": 85, "excremento": 85, "abraxas": 85, "aldohexosa": 85,
      "anafilaxis": 85, "axinita": 85, "bixaceo": 85, "exegesis": 85,
      "xenon": 100, "xilografia": 100, "xeroftalmia": 100, "xilofago": 100, "xifoides": 100, "xerocopia": 100, "xiloprotector": 100,
      "alexia": 100, "anfictionia": 100, "anfiction": 100, "antioxidante": 100, "antropotaxonomia": 100, "apirexia": 100, "autotoxemia": 100,
      "axiopolis": 100, "cataplexia": 100
    }
  },
  {
    id: "gen-022", dailyId: "dia4-03", pack: "general",
    texto: "Videojuego o saga de supervivencia, zombis o apocalipsis postapocalíptico",
    ejemplo: "fallout",
    answers: {
      "the last of us": 10, "resident evil": 10, "fallout": 10, "the walking dead": 10,
      "left 4 dead": 10, "dying light": 10, "days gone": 10, "metro": 10,
      "rust": 10, "dayz": 10, "last of us": 10, "tlou": 10,
      "project zomboid": 25, "stalker": 25, "7 days to die": 25, "state of decay": 25,
      "dead island": 25, "dead rising": 25, "unturned": 25, "green hell": 25,
      "the forest": 25, "sons of the forest": 25, "dead space": 25, "wasteland": 25,
      "frostpunk": 25, "dont starve": 25, "subnautica": 25, "stalker 2": 25,
      "fallout new vegas": 25, "fallout 3": 25, "fallout 4": 25, "fallout 76": 25,
      "resident evil 2": 25, "resident evil 4": 25, "resident evil village": 25, "metro 2033": 25,
      "metro exodus": 25, "state of decay 2": 25, "cataclysm dda": 45, "mist survival": 45,
      "dead frontier": 45, "mad max": 45, "generation zero": 45, "this war of mine": 45,
      "chernobylite": 45, "the long dark": 45, "conan exiles": 45, "scum": 45,
      "dead by daylight": 45, "world war z": 45, "back 4 blood": 45, "killing floor": 45,
      "killing floor 2": 45, "remnant from the ashes": 45, "remnant 2": 45, "terminator resistance": 45,
      "encased": 45, "underrail": 45, "atom rpg": 45, "death stranding": 45,
      "rage": 45, "rage 2": 45, "borderlands": 45, "enshrouded": 45,
      "palworld": 45, "grounded": 45, "raft": 45, "stranded deep": 45,
      "sunless sea": 45, "the flame in the flood": 45, "cataclysm dark days ahead": 65, "dead frontier 2": 65,
      "s t a l k e r": 65, "stalker shadow of chernobyl": 65, "stalker call of pripyat": 65, "stalker clear sky": 65,
      "metro last light": 65, "resident evil nemesis": 65, "resident evil 3": 65, "resident evil revelations": 65,
      "dead rising 2": 65, "dead rising 3": 65, "dead rising 4": 65, "dead space 2": 65,
      "dead space 3": 65, "how to survive": 65, "how to survive 2": 65, "sheltered": 65,
      "sheltered 2": 65, "they are billions": 65, "infectonator": 65, "rebuild": 65,
      "dead state": 65, "survivalist": 65, "survivalist invisible strain": 65, "i am alive": 65,
      "zombi u": 65, "zombi": 65, "deadlight": 65, "lone survivor": 65,
      "darkwood": 65, "signalist": 65, "surviving the aftermath": 85, "endzone a world apart": 85,
      "frostpunk 2": 85, "flotsam": 85, "far lone sails": 85, "far changing tides": 85,
      "convoy": 85, "bedlam": 85, "dead age": 85, "dead age 2": 85,
      "judgment apocalypse survival simulation": 85, "overland": 85, "symbiosis": 85, "the infected": 85,
      "night of the dead": 85, "subsistence": 85, "survive the nights": 85, "the front": 85,
      "myth of empires": 85, "icarus": 85, "breathedge": 85, "forever skies": 85,
      "pacific drive": 85, "planet crafter": 85, "bad mojo": 100, "burndead": 100,
      "abomination the nemesis project": 100, "flesh feast": 100, "all hallows eve": 100, "zombie revenge": 100,
      "onechanbara": 100, "stubbs the zombie": 100, "fort zombie": 100, "trapped dead": 100,
      "dead horde": 100, "nation red": 100, "burn zombie burn": 100, "blood drive": 100,
      "charlie murder": 100, "dead pixels": 100
    }
  },
  {
    id: "gen-023", dailyId: "dia4-04", pack: "general",
    texto: "Plato de cuchara, potaje, sopa o guiso tradicional español",
    ejemplo: "cocido",
    answers: {
      "lentejas": 10, "cocido madrileño": 10, "cocido": 10, "fabada asturiana": 10, "fabada": 10, "puchero": 10, "sopa de fideos": 10,
      "gazpacho": 10, "salmorejo": 10, "lentejas con chorizo": 10, "paella": 10,
      "pote gallego": 25, "caldereta": 25, "menestra": 25, "porrusalda": 25, "gachas": 25, "migas": 25, "ajoarriero": 25,
      "sopa castellana": 25, "sopa de ajo": 25, "garbanzos con espinacas": 25, "judias con chorizo": 25, "alubias": 25, "patatas a la riojana": 25, "sancocho": 25,
      "fabes": 25, "caldillo de perro": 25, "alubias con chorizo": 25, "olla podrida": 25, "puchero andaluz": 25, "escudella": 25, "garbanzos con chorizo": 25,
      "sopa de picadillo": 25, "gazpacho andaluz": 25,
      "patatas con costillas": 45, "guiso de patatas con carne": 45, "estofado de ternera": 45, "rabo de toro": 45, "callos a la madrileña": 45, "callos": 45, "sopa de marisco": 45,
      "sopa de pescado": 45, "crema de verduras": 45, "crema de calabaza": 45, "crema de calabacin": 45, "ajoblanco": 45, "gazpacho manchego": 45, "suquet de peix": 45,
      "suquet": 45, "zarzuela de marisco": 45, "arroz caldoso": 45, "arroz con bogavante": 45, "caldo gallego": 45, "caldo de pollo": 45, "crema de puerros": 45,
      "vichyssoise": 45, "alubias de tolosa": 45, "fabes con almejas": 45, "alubias blancas con chorizo": 45, "potaje de vigilia": 45, "potaje de garbanzos": 45, "potaje de lentejas": 45,
      "bacalao al ajoarriero": 65, "caldereta de cordero": 65, "caldereta de langosta": 65, "caldo de cocido": 65, "caldo tlalpeño": 65, "carcamusas": 65, "chilindron": 65,
      "pollo al chilindron": 65, "cordero al chilindron": 65, "carrillada": 65, "carrillada iberica": 65, "guisantes con jamon": 65, "habas con jamon": 65, "alboronia": 65,
      "boronias": 65, "berza jerezana": 65, "berza gaditana": 65, "olla gitana": 65, "empedrado": 65, "morteruelo": 65, "atascaburras": 65,
      "ajopringue": 65, "tumbet": 65, "caldo con pelotas": 65, "cocido montañes": 65, "cocido lebaniego": 65, "cocido maragato": 65, "escudella i carn d olla": 65,
      "sopa boba": 65, "sopas mallorquinas": 65, "caldo bordeles": 65,
      "marmitako": 85, "pipirrana": 85, "gazpachuelo": 85, "andrajos": 85, "andrajos con liebre": 85, "gurullos": 85, "gurullos con conejo": 85,
      "pericana": 85, "rin ran": 85, "mojete": 85, "cojondongo": 85, "zarangollo": 85, "frito mallorquin": 85, "porra antequerana": 85,
      "zoque malagueño": 85, "salmorejo cordobes": 85, "caldereta de pescado": 85, "sopa de almendras": 85, "sopa de cebolla española": 85, "sopa de tomate extremeña": 85, "sopas de gato": 85,
      "sopa campera": 85, "gazpacho de pastor": 85, "gachas manchegas": 85, "gachamiga": 85, "borona": 85, "borage con patatas": 85, "cardo con almendras": 85,
      "habas a la catalana": 85, "faves a la catalana": 85, "fideua caldosa": 85,
      "caldo de zopas": 100, "potaje de hinojos": 100, "potaje de jaramagos": 100, "potaje de tagarninas": 100, "berza de coles": 100, "berza de cardillos": 100, "caldillo de pintarroja": 100,
      "sopa de maimones": 100, "sopa de galets": 100, "olluquiña": 100, "caldo de castañas": 100, "puchero canario": 100, "rancho canario": 100, "carne fiesta": 100,
      "ropa vieja de puchero": 100, "pote asturiano": 100, "arroz con costra caldoso": 100, "guisado de trigo": 100, "olla de trigo": 100
    }
  },
  {
    id: "gen-024", dailyId: "dia4-05", pack: "general",
    texto: "Raza canina (perro) de compañía, trabajo o pastoreo",
    ejemplo: "pastor aleman",
    answers: {
      "pastor aleman": 10, "labrador": 10, "golden retriever": 10, "chihuahua": 10, "bulldog": 10, "caniche": 10, "yorkshire": 10,
      "husky": 10, "boxer": 10, "pitbull": 10, "rottweiler": 10, "galgo": 10,
      "podenco": 25, "mastin español": 25, "alano español": 25, "perro de agua español": 25, "bodeguero andaluz": 25, "mastin del pirineo": 25, "doberman": 25,
      "border collie": 25, "beagle": 25, "teckel": 25, "carlino": 25, "pug": 25, "chow chow": 25, "shiba inu": 25,
      "akita": 25, "dalmata": 25, "gran danes": 25, "san bernardo": 25, "terranova": 25, "samoyedo": 25, "lhasa apso": 25,
      "bichon maltes": 25, "braco aleman": 25, "pastor belga": 25,
      "pastor australiano": 45, "australian shepherd": 45, "shih tzu": 45, "bichon frise": 45, "bichon habanero": 45, "pomerania": 45, "jack russell": 45,
      "jack russell terrier": 45, "bull terrier": 45, "staffordshire bull terrier": 45, "american stanfford": 45, "american staffordshire terrier": 45, "dogo de burdeos": 45, "mastin napolitano": 45,
      "cane corso": 45, "pointer": 45, "setter irlandes": 45, "setter ingles": 45, "braco de weimar": 45, "weimaraner": 45, "galgo español": 45,
      "podenco ibicenco": 45, "podenco canario": 45, "podenco andaluz": 45, "perro de agua": 45, "ratonero valenciano": 45, "ratonero bodeguero andaluz": 45, "sabueso español": 45,
      "perdiguero de burgos": 45, "perro pastor vasco": 45, "euskal artzain txakurra": 45, "can de palleiro": 45,
      "basset hound": 65, "bloodhound": 65, "sabueso de san huberto": 65, "greyhound": 65, "whippet": 65, "galgo afgano": 65, "saluki": 65,
      "borzoi": 65, "wolfhound irlandes": 65, "lebrel escoces": 65, "deerhound": 65, "fox terrier": 65, "airedale terrier": 65, "boston terrier": 65,
      "bullmastiff": 65, "fila brasileño": 65, "tosa inu": 65, "akita inu": 65, "akita americano": 65, "shiba": 65, "spitz japones": 65,
      "spitz aleman": 65, "keeshond": 65, "eurasier": 65, "malamute": 65, "alaskan malamute": 65, "husky de alaska": 65, "laika de siberia": 65,
      "pastor blanco suizo": 65, "pastor de beauce": 65,
      "komondor": 85, "basenji": 85, "dogo del tibet": 85, "mastin tibetano": 85, "pastor tibetano": 85, "bobtail": 85, "antiguo perro pastor ingles": 85,
      "collie de pelo largo": 85, "collie barbudo": 85, "bearded collie": 85, "sheltie": 85, "pastor de las islas shetland": 85, "welsh corgi": 85, "corgi pembroke": 85,
      "corgi cardigan": 85, "cavalier king charles spaniel": 85, "king charles spaniel": 85, "pequines": 85, "papillon": 85, "phalene": 85, "perro crestado chino": 85,
      "crestado chino": 85, "xoloitzcuintle": 85, "xoloitzcuintli": 85, "perro sin pelo del peru": 85, "affenfinscher": 85, "affenpinscher": 85, "pinscher miniatura": 85,
      "dandie dinmont terrier": 85, "turco andaluz": 85, "perro turco andaluz": 85, "perro turco": 85,
      "kuvasz": 100, "puli": 100, "mudi": 100, "bergamasco": 100, "pastor bergamasco": 100, "pastor de maremma": 100, "cane da pastore maremmano": 100,
      "pastor del caucaso": 100, "pastor de asia central": 100, "alabai": 100, "pastor de anatolia": 100, "kangal": 100, "akbash": 100, "tornjak": 100,
      "sarplaninac": 100, "pastor croata": 100
    }
  },
  {
    id: "gen-025", dailyId: "dia4-06", pack: "general",
    texto: "Prenda de vestir, prenda de abrigo o calzado cotidiano o formal",
    ejemplo: "pantalon",
    answers: {
      "pantalon": 10, "camiseta": 10, "camisa": 10, "sudadera": 10, "jersey": 10, "chaqueta": 10, "abrigo": 10,
      "zapatillas": 10, "zapatos": 10, "calcetines": 10, "calzoncillos": 10, "bragas": 10,
      "chandal": 25, "cazadora": 25, "vaqueros": 25, "tejanos": 25, "bermudas": 25, "bañador": 25, "americana": 25,
      "blazer": 25, "chaleco": 25, "corbata": 25, "pajarita": 25, "polar": 25, "plumas": 25, "anorak": 25,
      "botines": 25, "botas": 25, "chanclas": 25, "mocasines": 25, "alpargatas": 25, "zuecos": 25, "sandalias": 25,
      "pijama": 25, "bata": 25, "albornoz": 25,
      "shorts": 45, "pantalon corto": 45, "pantalon vaquero": 45, "pantalon de pinzas": 45, "pantalon de chandal": 45, "top": 45, "blusa": 45,
      "polo": 45, "camiseta de tirantes": 45, "sueter": 45, "cardigan": 45, "rebeca": 45, "parka": 45, "trench": 45,
      "sobretodo": 45, "levita": 45, "chaque": 45, "frac": 45, "traje": 45, "traje de chaqueta": 45, "mono": 45,
      "peto": 45, "leggins": 45, "mallas": 45, "culotte": 45, "tanga": 45, "boxer": 45, "calzoncillo boxer": 45,
      "biquini": 45, "bikini": 45, "triquini": 45, "pareo": 45,
      "gabardina": 65, "esmoquin": 65, "miton": 65, "mitones": 65, "bailarinas": 65, "manoletinas": 65, "merceditas": 65,
      "tacones": 65, "zapatos de tacon": 65, "stiletto": 65, "plataformas": 65, "botas de agua": 65, "katiuskas": 65, "botas militares": 65,
      "zapatillas de deporte": 65, "bambas": 65, "tenis": 65, "playeras": 65, "chancletas": 65, "crocs": 65, "espardenyas": 65,
      "avarcas": 65, "menorquinas": 65, "babuchas": 65, "pantuflas": 65, "zapatillas de estar por casa": 65, "escarpines": 65, "chubasquero": 65,
      "impermeable": 65, "corta vientos": 65, "cortavientos": 65, "chaleco acolchado": 65, "bomber": 65, "chaqueta bomber": 65, "perfecto": 65,
      "biker": 65,
      "dunks": 85, "guardapolvos": 85, "pelliza": 85, "trenca": 85, "pellon": 85, "chilaba": 85, "caftan": 85,
      "kimono": 85, "sari": 85, "poncho": 85, "capa": 85, "ruana": 85, "sarong": 85, "kilt": 85,
      "falda escocesa": 85, "falda pantalon": 85, "minifalda": 85, "falda midi": 85, "falda de tubo": 85, "falda plisada": 85, "enagua": 85,
      "cancan": 85, "corset": 85, "corse": 85, "faja": 85,
      "fedora": 100, "panama": 100, "sombrero panama": 100, "canotier": 100, "pamela": 100, "trilby": 100, "chapka": 100,
      "ushanka": 100, "sombrero cordobes": 100, "montera": 100, "barretina": 100, "txapela": 100, "birrete": 100, "turbante": 100,
      "fez": 100, "balaclava": 100
    }
  },
  {
    id: "gen-026", dailyId: "dia4-07", pack: "general",
    texto: "Elemento químico de la tabla periódica",
    ejemplo: "oxigeno",
    answers: {
      "oro": 10, "plata": 10, "hierro": 10, "oxigeno": 10, "carbono": 10, "hidrogeno": 10, "helio": 10,
      "cobre": 10, "plomo": 10, "mercurio": 10, "aluminio": 10, "nitrogeno": 10,
      "sodio": 25, "potasio": 25, "cloro": 25, "fosforo": 25, "azufre": 25, "zinc": 25, "titanio": 25,
      "estaño": 25, "niquel": 25, "magnesio": 25, "silicio": 25, "neon": 25, "argon": 25, "kripton": 25,
      "xenon": 25, "radon": 25, "yodo": 25, "fluor": 25, "bromo": 25, "tungsteno": 25, "platino": 25,
      "litio": 25, "berilio": 25, "boro": 25, "cobalto": 25,
      "antimonio": 45, "astato": 45, "cadmio": 45, "cesio": 45, "circonio": 45, "cromo": 45, "escandio": 45,
      "galio": 45, "germanio": 45, "hafnio": 45, "indio": 45, "iridio": 45, "manganeso": 45, "molibdeno": 45,
      "niobio": 45, "osmio": 45, "paladio": 45, "renio": 45, "rodio": 45, "rubidio": 45, "rutenio": 45,
      "talo": 45, "talio": 45, "tantalio": 45, "teluro": 45, "vanadio": 45, "zirconio": 45, "curio": 45,
      "berkelio": 45, "californio": 45, "fermio": 45, "nobelio": 45,
      "wolframio": 65, "lantano": 65, "cerio": 65, "praseodimio": 65, "neodimio": 65, "prometio": 65, "samario": 65,
      "europio": 65, "gadolinio": 65, "terbio": 65, "disprosio": 65, "holmio": 65, "erbio": 65, "tulio": 65,
      "iterbio": 65, "lutecio": 65, "actinio": 65, "torio": 65, "protactinio": 65, "neptunio": 65, "roentgenio": 65,
      "copernicio": 65, "nihonio": 65, "flerovio": 65, "moscovio": 65, "livermorio": 65, "teneso": 65, "tennesino": 65,
      "hidrogeno liquido": 65, "oxigeno gas": 65, "nitrogeno liquido": 65, "hielo seco": 65, "mercurio liquido": 65,
      "natrium": 85, "kalium": 85, "stibium": 85, "hydrargyrum": 85, "argentum": 85, "aurum": 85, "ferrum": 85,
      "cuprum": 85, "plumbum": 85, "wolfram": 85, "stannum": 85, "ununoctio": 85, "ununseptio": 85, "ununhexio": 85,
      "ununpentio": 85, "ununquadio": 85, "ununtrio": 85, "ununbio": 85, "unununio": 85, "ununnilio": 85, "eka aluminio": 85,
      "eka silicio": 85, "eka boro": 85, "eka manganeso": 85, "mendelevio": 85,
      "kurchatovio": 100, "hahnio": 100, "nielsbohrio": 100, "anunio": 100, "eka yodo": 100, "eka radon": 100, "eka francio": 100,
      "eka radio": 100, "eka actinio": 100, "eka torio": 100, "ununennio": 100, "unbinilio": 100, "unbiunio": 100, "unbibio": 100,
      "unbitrio": 100, "unbiquadio": 100
    }
  }
];
