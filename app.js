(function(){
"use strict";

/* ================= helpers ================= */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad = n => String(n).padStart(2,"0");
const keyOf = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parseKey = k => { const a = k.split("-").map(Number); return new Date(a[0], a[1]-1, a[2], 12); };
const mondayOf = d => { const x = new Date(d); x.setHours(12,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
const today = () => keyOf(new Date());
const clone = o => JSON.parse(JSON.stringify(o));
const fmt = s => Math.floor(s/60)+":"+pad(s%60);
function pl(n, one, few, many){ const a = Math.abs(n)%100, b = a%10; if(a>10&&a<20) return many; if(b>1&&b<5) return few; if(b===1) return one; return many; }
const nf = v => String(Math.round(v*10)/10).replace(".", ",");
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ICON = {
  check:"M5 12.5l4.5 4.5L19 7.5", chev:"M9 6l6 6-6 6", x:"M6 6l12 12M18 6L6 18", undo:"M10 6l-6 6 6 6M4 12h16", plus:"M12 5v14M5 12h14",
  star:"M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z",
  flame:"M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z",
  bag:"M5 8h14v11H5zM9 8V5h6v3", globe:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  sun:"M4 18h16M7 18a5 5 0 0 1 10 0M12 6v3M5 10l2 2M19 10l-2 2", up:"M12 19V6M6 12l6-6 6 6",
  cup:"M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8",
  wave:"M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0", cal:"M5 6h14v14H5zM5 10h14M9 4v4M15 4v4",
  bolt:"M13 3L5 13h6l-1 8 8-10h-6z", rep:"M5 9a7 7 0 0 1 12-3l2 2M19 15a7 7 0 0 1-12 3l-2-2M19 4v4h-4M5 20v-4h4",
  db:"M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10", body:"M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 10h12M12 10v6M9 21l3-5 3 5"
};
const ico = n => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICON[n]+'"/></svg>';

/* ================= exercise library ================= */
// Poses: side view, facing right. h head, s shoulder, p hip, k1/f1 near knee/foot, k2/f2 far, e1/w1 near elbow/hand, e2/w2 far.
const LEGS = {p:[100,76],k1:[102,102],f1:[104,128],k2:[98,102],f2:[96,128]};
const STAND = Object.assign({h:[100,26],s:[100,40],e1:[102,58],w1:[102,78],e2:[98,58],w2:[98,78]}, LEGS);
const SQ_B = {h:[107,52],s:[103,66],p:[86,100],k1:[114,98],f1:[106,128],k2:[110,100],f2:[100,128]};
const LUNGE_B = {h:[101,50],s:[100,64],p:[98,98],k1:[120,100],f1:[118,128],k2:[80,124],f2:[60,127],e1:[101,82],w1:[102,98],e2:[97,82],w2:[98,98]};
const PUSH_A = {h:[153,90],s:[140,98],p:[90,111],k1:[65,119],f1:[40,126],k2:[65,119],f2:[40,126],e1:[141,113],w1:[142,128],e2:[138,113],w2:[139,128]};
const PUSH_B = {h:[154,110],s:[140,117],p:[90,121],k1:[65,123],f1:[40,126],k2:[65,123],f2:[40,126],e1:[127,112],w1:[142,128],e2:[124,112],w2:[139,128]};
const PLANK_A = {h:[152,95],s:[140,102],p:[92,112],k1:[66,119],f1:[40,126],k2:[66,119],f2:[40,126],e1:[140,126],w1:[160,126],e2:[137,126],w2:[157,126]};
const ROW_A = {h:[142,58],s:[128,66],p:[80,80],k1:[90,104],f1:[90,128],k2:[84,104],f2:[80,128],e1:[129,86],w1:[130,104],e2:[108,86],w2:[92,100]};
const RDL_B = {h:[141,88],s:[128,91],p:[84,76],k1:[94,102],f1:[98,128],k2:[90,102],f2:[94,128],e1:[127,105],w1:[124,118],e2:[124,105],w2:[121,118]};
const BRIDGE_ARMS = {h:[46,119],s:[60,123],e1:[76,127],w1:[92,128],e2:[74,127],w2:[90,128]};
const DB_A = {h:[56,118],s:[70,121],p:[110,122],k1:[112,96],f1:[132,96],k2:[108,96],f2:[128,96],e1:[72,104],w1:[72,88],e2:[68,104],w2:[68,88]};
const DB_B = {h:[56,118],s:[70,121],p:[110,122],k1:[134,114],f1:[158,118],k2:[108,96],f2:[128,96],e1:[72,104],w1:[72,88],e2:[54,110],w2:[38,106]};
const PIKE_A = {h:[134,110],s:[126,101],p:[94,68],k1:[72,97],f1:[50,126],k2:[72,97],f2:[48,126],e1:[134,115],w1:[140,128],e2:[131,115],w2:[137,128]};
const PIKE_B = {h:[139,123],s:[129,114],p:[95,72],k1:[72,99],f1:[50,126],k2:[72,99],f2:[48,126],e1:[123,119],w1:[140,128],e2:[120,119],w2:[137,128]};
const mix = (a,b,t) => { const o = {}; for(const k in a) o[k] = [a[k][0]+(b[k][0]-a[k][0])*t, a[k][1]+(b[k][1]-a[k][1])*t]; return o; };
const POSES = {
  squat:{a:STAND, b:Object.assign({e1:[119,70],w1:[135,68],e2:[117,72],w2:[133,70]}, SQ_B)},
  chairsquat:{a:STAND, b:{h:[103,50],s:[99,64],p:[84,98],k1:[112,99],f1:[106,128],k2:[108,101],f2:[100,128],e1:[115,69],w1:[131,68],e2:[113,71],w2:[129,70]}},
  goblet:{a:Object.assign({h:[101,26],s:[100,40],e1:[110,58],w1:[108,46],e2:[106,58],w2:[104,46]}, LEGS), b:Object.assign({e1:[117,84],w1:[115,72],e2:[113,84],w2:[111,72]}, SQ_B)},
  splitsquat:{a:{h:[101,30],s:[100,44],p:[98,78],k1:[112,103],f1:[118,128],k2:[84,104],f2:[60,127],e1:[101,62],w1:[102,80],e2:[97,62],w2:[98,80]}, b:LUNGE_B},
  lunge:{a:STAND, b:LUNGE_B},
  bulgarian:{a:{h:[105,28],s:[104,42],p:[103,76],k1:[114,102],f1:[118,128],k2:[84,96],f2:[62,104],e1:[105,60],w1:[105,78],e2:[101,60],w2:[101,78]},
             b:{h:[108,54],s:[106,68],p:[98,100],k1:[124,104],f1:[118,128],k2:[80,120],f2:[62,104],e1:[107,86],w1:[107,102],e2:[103,86],w2:[103,102]}},
  pushup:{a:PUSH_A, b:PUSH_B},
  inclinepush:{a:{h:[151,62],s:[138,70],p:[90,97],k1:[65,112],f1:[40,126],k2:[65,112],f2:[40,126],e1:[140,85],w1:[142,100],e2:[137,85],w2:[139,100]},
               b:{h:[153,82],s:[140,89],p:[90,107],k1:[65,117],f1:[40,126],k2:[65,117],f2:[40,126],e1:[127,84],w1:[142,100],e2:[124,84],w2:[139,100]}},
  kneepush:{a:Object.assign({}, PUSH_A, {p:[100,108],k1:[74,125],f1:[56,110],k2:[74,125],f2:[56,110]}),
            b:Object.assign({}, PUSH_B, {p:[100,120],k1:[74,125],f1:[56,110],k2:[74,125],f2:[56,110]})},
  feetpush:{a:Object.assign({}, PUSH_A, {h:[153,91],p:[90,99],k1:[65,100],f1:[40,100],k2:[65,100],f2:[40,100]}),
            b:Object.assign({}, PUSH_B, {h:[154,111],p:[90,108],k1:[65,104],f1:[40,100],k2:[65,104],f2:[40,100]})},
  bridge:{a:Object.assign({p:[90,124],k1:[114,100],f1:[128,128],k2:[110,100],f2:[124,128]}, BRIDGE_ARMS),
          b:Object.assign({p:[95,103],k1:[119,97],f1:[128,128],k2:[115,97],f2:[124,128]}, BRIDGE_ARMS)},
  bridge1:{a:Object.assign({p:[90,124],k1:[116,113],f1:[142,104],k2:[110,100],f2:[124,128]}, BRIDGE_ARMS),
           b:Object.assign({p:[95,103],k1:[121,94],f1:[147,86],k2:[115,97],f2:[124,128]}, BRIDGE_ARMS)},
  plank:{a:PLANK_A, b:Object.assign({}, PLANK_A, {p:[92,109],k1:[66,118],k2:[66,118]})},
  kneeplank:{a:Object.assign({}, PLANK_A, {p:[100,111],k1:[74,125],f1:[56,110],k2:[74,125],f2:[56,110]}),
             b:Object.assign({}, PLANK_A, {p:[100,109],k1:[74,125],f1:[56,110],k2:[74,125],f2:[56,110]})},
  planklift:{a:PLANK_A, b:Object.assign({}, PLANK_A, {k1:[66,111],f1:[40,104]})},
  deadbug:{a:DB_A, b:DB_B},
  deadbuglegs:{a:DB_A, b:Object.assign({}, DB_B, {e2:DB_A.e2, w2:DB_A.w2})},
  rdl:{a:STAND, b:RDL_B},
  rdl1:{a:STAND, b:Object.assign({}, RDL_B, {k2:[58,74],f2:[32,74]})},
  row:{a:ROW_A, b:Object.assign({}, ROW_A, {e1:[110,57],w1:[119,77]})},
  row2:{a:Object.assign({}, ROW_A, {e2:[126,86],w2:[127,104]}), b:Object.assign({}, ROW_A, {e1:[110,57],w1:[119,77],e2:[107,58],w2:[116,78]})},
  press:{a:Object.assign({h:[100,26],s:[100,40],e1:[110,54],w1:[108,40],e2:[106,54],w2:[104,40]}, LEGS),
         b:Object.assign({h:[100,26],s:[100,40],e1:[105,24],w1:[105,8],e2:[101,24],w2:[101,8]}, LEGS)},
  pike:{a:PIKE_A, b:PIKE_B},
  pikehalf:{a:PIKE_A, b:mix(PIKE_A, PIKE_B, .5)}
};
const SQ_CUES = ["Стопы чуть шире плеч, носки слегка врозь","Опускайся, пока бёдра не станут параллельны полу","Спина ровная, пятки не отрываются от пола"];
// g group, m movement family, r [low, high] target, u unit, side = per side, w = weighted (kg0 start, ks step), p pose
const EX = {
  chairsquat:{n:"Приседания на стул",g:"legs",m:"squat",r:[8,15],p:"chairsquat",box:[60,104,34,27],cues:["Встань спиной к стулу, стопы на ширине плеч","Медленно опускайся, слегка коснись сиденья и вставай","Колени смотрят туда же, куда носки"]},
  squat:{n:"Приседания",g:"legs",m:"squat",r:[12,25],p:"squat",cues:SQ_CUES},
  squatpause:{n:"Приседания с паузой",g:"legs",m:"squat",r:[10,20],p:"squat",note:"Внизу задержись на 2 секунды.",cues:["Опустись и замри на 2 секунды","Вставай плавно, без рывка","Спина ровная, пятки на полу"]},
  goblet:{n:"Приседания с гантелью у груди",g:"legs",m:"squat",r:[8,15],w:1,kg0:6,ks:2,p:"goblet",prop:"db",cues:["Держи гантель вертикально у груди двумя руками","Садись между стоп, локти смотрят вниз","Спина ровная, пятки на полу"]},
  splitsquat:{n:"Сплит-приседания",g:"legs",m:"lunge",r:[8,12],side:1,p:"splitsquat",cues:["Одна нога впереди, другая сзади на носке","Опускайся прямо вниз, заднее колено почти касается пола","Можно держаться рукой за стену"]},
  revlunge:{n:"Выпады назад",g:"legs",m:"lunge",r:[8,12],side:1,p:"lunge",cues:["Шагни назад и опусти заднее колено почти до пола","Вес на пятке передней ноги","Корпус держи прямо"]},
  dblunge:{n:"Выпады назад с гантелями",g:"legs",m:"lunge",r:[8,12],side:1,w:1,kg0:4,ks:1,p:"lunge",prop:"db2",cues:["Гантели в опущенных руках","Шагни назад и опусти заднее колено почти до пола","Вес на пятке передней ноги"]},
  bulgarian:{n:"Болгарские сплит-приседания",g:"legs",m:"lunge",r:[8,12],side:1,p:"bulgarian",box:[40,104,34,27],cues:["Задняя стопа лежит на стуле или кровати","Опускайся прямо вниз, переднее колено над стопой","Толкайся пяткой передней ноги"]},
  inclinepush:{n:"Отжимания от опоры",g:"chest",m:"push",r:[8,15],p:"inclinepush",box:[130,101,34,30],cues:["Ладони на столе, кровати или подоконнике","Тело прямое от пяток до макушки","Опускай грудь к опоре, локти под 45° к корпусу"]},
  kneepush:{n:"Отжимания с колен",g:"chest",m:"push",r:[8,15],p:"kneepush",cues:["Колени на полу, тело прямое от колен до макушки","Опускайся, пока грудь почти не коснётся пола","Локти под 45° к корпусу"]},
  pushup:{n:"Отжимания",g:"chest",m:"push",r:[6,15],p:"pushup",cues:["Тело одной линией от пяток до макушки","Опускайся, пока грудь почти не коснётся пола","Локти примерно под 45° к корпусу"]},
  pushpause:{n:"Отжимания с паузой",g:"chest",m:"push",r:[6,12],p:"pushup",note:"Внизу задержись на 2 секунды.",cues:["Опустись и замри на 2 секунды у пола","Тело прямое, живот подтянут","Выжимай себя вверх без рывка"]},
  feetpush:{n:"Отжимания, ноги на опоре",g:"chest",m:"push",r:[6,12],p:"feetpush",box:[24,102,30,29],cues:["Стопы на стуле или кровати, ладони на полу","Тело прямое, поясница не провисает","Опускайся, пока грудь почти не коснётся пола"]},
  bridge:{n:"Ягодичный мост",g:"post",m:"bridge",r:[12,20],p:"bridge",cues:["Лёжа на спине, пятки близко к ягодицам","Поднимай таз до прямой линии колени — плечи","Наверху сожми ягодицы на 1 секунду"]},
  bridge1:{n:"Мост на одной ноге",g:"post",m:"bridge",r:[8,15],side:1,p:"bridge1",cues:["Одна нога согнута, вторая выпрямлена","Поднимай таз за счёт опорной ноги","Таз не заваливается набок"]},
  dbbridge:{n:"Мост с гантелью",g:"post",m:"bridge",r:[10,15],w:1,kg0:8,ks:2,p:"bridge",prop:"db",at:"p",cues:["Гантель лежит на тазу, придерживай её руками","Поднимай таз до прямой линии колени — плечи","Наверху сожми ягодицы на 1 секунду"]},
  kneeplank:{n:"Планка с колен",g:"core",m:"plank",r:[20,40],u:"sec",p:"kneeplank",cues:["Локти под плечами, колени на полу","Тело прямое от колен до макушки","Живот и ягодицы напряжены"]},
  plank:{n:"Планка",g:"core",m:"plank",r:[30,60],u:"sec",p:"plank",cues:["Локти под плечами","Подкрути таз, напряги живот и ягодицы","Не проваливай поясницу"]},
  planklift:{n:"Планка с подъёмом ноги",g:"core",m:"plank",r:[30,60],u:"sec",p:"planklift",cues:["Встань в планку на предплечьях","По очереди поднимай прямую ногу на 2–3 секунды","Таз не раскачивается"]},
  deadbuglegs:{n:"Мёртвый жук: только ноги",g:"core",m:"deadbug",r:[8,12],side:1,p:"deadbuglegs",cues:["Лёжа на спине: руки вверх, колени согнуты под 90°","По очереди выпрямляй ноги, не касаясь пола","Поясница всё время прижата к полу"]},
  deadbug:{n:"Мёртвый жук",g:"core",m:"deadbug",r:[8,12],side:1,p:"deadbug",cues:["Поясница всё время прижата к полу","Выпрямляй противоположные руку и ногу","Медленно, на выдохе"]},
  deadbugslow:{n:"Мёртвый жук медленно",g:"core",m:"deadbug",r:[8,12],side:1,p:"deadbug",note:"Три секунды туда, три секунды обратно.",cues:["Выпрямляй руку и ногу 3 секунды, возвращай 3 секунды","Поясница прижата к полу","Дыши ровно, не задерживай дыхание"]},
  hinge:{n:"Наклоны с прямой спиной",g:"post",m:"hinge",r:[12,20],p:"rdl",cues:["Ладони на бёдрах, колени чуть согнуты","Отводи таз назад, спина прямая","Наклоняйся, пока тянется задняя поверхность бедра"]},
  rdl:{n:"Румынская тяга с гантелями",g:"post",m:"hinge",r:[8,15],w:1,kg0:6,ks:2,p:"rdl",prop:"db2",cues:["Колени чуть согнуты и почти не двигаются","Отводи таз назад, гантели скользят вдоль ног","Опускайся до натяжения задней поверхности бедра"]},
  rdl1:{n:"Наклоны на одной ноге",g:"post",m:"hinge",r:[8,12],side:1,p:"rdl1",cues:["Стой на одной ноге, колено чуть согнуто","Наклоняйся, отводя свободную ногу назад","Можно держаться рукой за стену"]},
  dbrow:{n:"Тяга гантели в наклоне",g:"back",m:"pull",r:[8,15],side:1,w:1,kg0:6,ks:1,p:"row",prop:"db",cues:["Спина ровная, свободная рука упирается в стул","Тяни локоть к бедру, а не вверх к уху","Внизу полностью выпрями руку"]},
  bagrow:{n:"Тяга рюкзака в наклоне",g:"back",m:"pull",r:[10,20],side:1,p:"row",prop:"bag",note:"Положи в рюкзак бутылки с водой или книги. Стало легко — добавь груз.",cues:["Спина ровная, свободная рука упирается в стул","Тяни рюкзак локтем к бедру","Внизу полностью выпрями руку"]},
  bagrowpause:{n:"Тяга рюкзака с паузой",g:"back",m:"pull",r:[8,15],side:1,p:"row",prop:"bag",note:"Наверху задержись на 2 секунды.",cues:["Подтяни рюкзак к поясу и замри на 2 секунды","Опускай медленно","Спина ровная, корпус не раскачивается"]},
  bandrow:{n:"Тяга резины в наклоне",g:"back",m:"pull",r:[10,20],p:"row2",prop:"band",cues:["Встань на резину, концы в руках","Наклонись с прямой спиной","Тяни локти назад и своди лопатки"]},
  bandrowpause:{n:"Тяга резины с паузой",g:"back",m:"pull",r:[8,15],p:"row2",prop:"band",note:"Наверху задержись на 2 секунды.",cues:["Подтяни руки к поясу и замри на 2 секунды","Опускай медленно","Спина ровная"]},
  press:{n:"Жим гантелей стоя",g:"shoulders",m:"press",r:[8,15],w:1,kg0:4,ks:1,p:"press",prop:"db2",cues:["Гантели у плеч, локти чуть впереди","Выжимай вверх, пока руки не выпрямятся","Живот подтянут, поясница не прогибается"]},
  pikehalf:{n:"Отжимания уголком, полповтора",g:"shoulders",m:"press",r:[6,12],p:"pikehalf",cues:["Ладони и стопы на полу, таз высоко, тело буквой Л","Опускай голову к полу наполовину","Выжимай себя вверх и назад"]},
  pike:{n:"Отжимания уголком",g:"shoulders",m:"press",r:[6,12],p:"pike",cues:["Ладони и стопы на полу, таз высоко, тело буквой Л","Опускай макушку к полу между ладонями","Выжимай себя вверх и назад"]},
  pikepause:{n:"Отжимания уголком с паузой",g:"shoulders",m:"press",r:[6,10],p:"pike",note:"Внизу задержись на 2 секунды.",cues:["Опусти макушку к полу и замри на 2 секунды","Таз остаётся высоко","Выжимай себя вверх и назад"]}
};
const MOVES = {
  squat:{n:"Присед",home:["chairsquat","squat","goblet"],travel:["chairsquat","squat","squatpause","bulgarian"],reg:{home:2,travel:1}},
  push:{n:"Отжимания",home:["inclinepush","kneepush","pushup","pushpause","feetpush"],travel:["inclinepush","kneepush","pushup","pushpause","feetpush"],reg:{home:2,travel:2}},
  bridge:{n:"Мост",home:["bridge","bridge1","dbbridge"],travel:["bridge","bridge1"],reg:{home:0,travel:0}},
  plank:{n:"Планка",home:["kneeplank","plank","planklift"],travel:["kneeplank","plank","planklift"],reg:{home:1,travel:1}},
  lunge:{n:"Выпады",home:["splitsquat","revlunge","dblunge"],travel:["splitsquat","revlunge","bulgarian"],reg:{home:1,travel:1}},
  pull:{n:"Тяга",home:["dbrow"],travel:["bagrow","bagrowpause"],band:["bandrow","bandrowpause"],reg:{home:0,travel:0}},
  press:{n:"Жим вверх",home:["press"],travel:["pikehalf","pike","pikepause"],reg:{home:0,travel:1}},
  deadbug:{n:"Мёртвый жук",home:["deadbuglegs","deadbug","deadbugslow"],travel:["deadbuglegs","deadbug","deadbugslow"],reg:{home:1,travel:1}},
  hinge:{n:"Наклоны",home:["hinge","rdl"],travel:["hinge","rdl1"],reg:{home:1,travel:0}}
};
const MOVE_ORDER = ["squat","lunge","hinge","bridge","push","press","pull","plank","deadbug"];
const W = {
  A:{n:"Присед и отжимания",blocks:[["squat","push"],["bridge","plank"]]},
  B:{n:"Выпады и тяга",blocks:[["lunge","pull"],["press","deadbug"]]},
  C:{n:"Наклоны и всё тело",blocks:[["hinge","push"],["squat","pull"]]}
};
const PLAN = {1:"A",2:"B",3:"C",4:"A",5:"B",6:"C",0:null};
const DOW = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const WEEK = [1,2,3,4,5,6,0];
const GROUPS = [["legs","Ноги"],["post","Ягодицы и бёдра сзади"],["chest","Грудь и трицепс"],["back","Спина и бицепс"],["shoulders","Плечи"],["core","Пресс и корпус"]];
const SEC = {push:{shoulders:.5}, squat:{post:.5}, lunge:{post:.5}, press:{chest:.5}};   // half credit for helper muscles
const MIN_SETS = 4, GOAL_SETS = 10, BAR_MAX = 18;
const XP = {set:10, workout:50, warm:5, pr:20, up:40, task:15, week:100};
const LEVELS = ["Новичок","Ученик","Любитель","Практик","Атлет","Опытный атлет","Мастер","Наставник","Чемпион","Легенда"];
const LEVELS_GEN = ["Новичка","Ученика","Любителя","Практика","Атлета","Опытного атлета","Мастера","Наставника","Чемпиона","Легенды"];
const WORK = {legs:"ноги и ягодицы",post:"ягодицы и бёдра сзади",chest:"грудь и трицепс",back:"спина и бицепс",shoulders:"плечи",core:"пресс и корпус"};
const HOT = {squat:"leg",lunge:"leg",hinge:"leg",bridge:"leg",push:"arm",press:"arm",pull:"arm",plank:"torso",deadbug:"torso"};
const need = n => 100*n*(n+1);   // points needed to finish level n
function levelOf(xp){ let l = 1; while(xp >= need(l)) l++; const lo = need(l-1), hi = need(l); return {l, name:LEVELS[Math.min(l, LEVELS.length)-1], lo, hi, pct:(xp-lo)/(hi-lo)}; }

/* ================= state and storage ================= */
// Everything lives on this device, in localStorage. Settings → «Данные» saves a backup file and loads it back.
// A day record keeps the current workout in its own fields (SESS) and earlier finished workouts of the same day in day.more.
const LS = "kt-v2", APP_VERSION = "1.0.0";
const SESS = ["w","rounds","place","tz","warm","sets","start","end","done","pr","up"];
function blank(){ return {v:2, ts:0, profile:{onb:false,place:"home",band:false,exp:"new",rounds:2,rest:60,sound:true,hint3:false,theme:"auto",inst:false}, prog:{home:{},travel:{}}, kg:{}, last:{}, best:{}, top:{}, low:{}, tasks:[], days:{}}; }
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
const numIn = (x, lo, hi, def) => (typeof x === "number" && isFinite(x)) ? Math.min(hi, Math.max(lo, x)) : def;
const intIn = (x, lo, hi, def) => Math.round(numIn(x, lo, hi, def));
// A saved copy is a file from outside, so nothing is trusted: every field is checked and unknown ones are dropped.
function cleanSession(o){
  const s = {};
  if(!isObj(o) || typeof o.w !== "string" || !has(W, o.w)) return s;
  s.w = o.w;
  if(isObj(o.sets)){
    const sets = {}; let n = 0;
    for(const k in o.sets){ const v = o.sets[k]; if(/^[01]-[0-2]-[01]$/.test(k) && Array.isArray(v) && typeof v[0] === "string" && has(EX, v[0])){ sets[k] = [v[0], intIn(v[1],0,999,0), numIn(v[2],0,500,0)]; n++; } }
    if(n) s.sets = sets;
  }
  if(o.rounds != null) s.rounds = intIn(o.rounds,1,3,2);
  if(o.place === "home" || o.place === "travel") s.place = o.place;
  if(o.tz != null) s.tz = intIn(o.tz,-900,900,0);
  if(typeof o.warm === "boolean") s.warm = o.warm;
  if(o.start) s.start = numIn(o.start,0,1e14,0);
  if(o.end) s.end = numIn(o.end,0,1e14,0);
  if(o.done === true && s.sets) s.done = true;
  if(o.pr) s.pr = intIn(o.pr,0,99,0);
  if(o.up) s.up = intIn(o.up,0,99,0);
  return s;
}
function cleanDay(o){
  if(!isObj(o)) return null;
  const d = cleanSession(o);
  if(isObj(o.prx)){ const p = {}; for(const k in o.prx) if(has(EX,k)) p[k] = 1; if(Object.keys(p).length) d.prx = p; }
  if(isObj(o.tasks)){ const t = {}; for(const k in o.tasks) if(/^t[a-z0-9]{1,16}$/.test(k)) t[k] = numIn(o.tasks[k],0,1e14,0); if(Object.keys(t).length) d.tasks = t; }
  if(Array.isArray(o.more)){ const m = o.more.slice(0,12).map(cleanSession).filter(x => x.w && x.sets); if(m.length) d.more = m; }
  return Object.keys(d).length ? d : null;
}
function sanitize(raw){
  if(!isObj(raw) || raw.v !== 2) return null;
  const s = blank(), p = isObj(raw.profile) ? raw.profile : {};
  s.ts = numIn(raw.ts,0,1e14,0);
  s.profile.onb = p.onb === true;
  if(p.place === "travel") s.profile.place = "travel";
  s.profile.band = p.band === true;
  if(p.exp === "reg") s.profile.exp = "reg";
  s.profile.rounds = intIn(p.rounds,1,3,2);
  s.profile.rest = [45,60,90,120].indexOf(p.rest) >= 0 ? p.rest : 60;
  s.profile.sound = p.sound !== false;
  s.profile.hint3 = p.hint3 === true;
  if(p.theme === "light" || p.theme === "dark") s.profile.theme = p.theme;
  s.profile.inst = p.inst === true;
  ["home","travel"].forEach(pl => { const src = isObj(raw.prog) && isObj(raw.prog[pl]) ? raw.prog[pl] : {}; for(const m in src) if(has(MOVES,m)) s.prog[pl][m] = intIn(src[m],0,9,0); });
  const each = (src, fn) => { if(isObj(src)) for(const k in src) if(has(EX,k)) fn(k, src[k]); };
  each(raw.kg, (k,v) => { s.kg[k] = numIn(v,1,500,1); });
  each(raw.last, (k,v) => { if(Array.isArray(v)) s.last[k] = v.slice(0,3).map(x => x == null ? null : intIn(x,0,999,0)); });
  each(raw.best, (k,v) => { if(isObj(v)) s.best[k] = {r:intIn(v.r,0,999,0), k:numIn(v.k,0,500,0)}; });
  each(raw.top, (k,v) => { s.top[k] = intIn(v,0,99,0); });
  each(raw.low, (k,v) => { if(v) s.low[k] = 1; });
  if(Array.isArray(raw.tasks)) raw.tasks.slice(0,50).forEach(t => {
    if(!isObj(t) || typeof t.id !== "string" || !/^t[a-z0-9]{1,16}$/.test(t.id) || typeof t.name !== "string" || !t.name.trim()) return;
    const days = Array.isArray(t.days) ? WEEK.filter(x => t.days.indexOf(x) >= 0) : [];
    s.tasks.push({id:t.id, name:t.name.trim().slice(0,40), kind:["check","timer","breath"].indexOf(t.kind) >= 0 ? t.kind : "check", min:intIn(t.min,1,60,3),
      time:(typeof t.time === "string" && /^\d\d:\d\d$/.test(t.time)) ? t.time : "08:00", days:days.length ? days : WEEK.slice()});
  });
  if(isObj(raw.days)) for(const k in raw.days) if(/^\d{4}-\d\d-\d\d$/.test(k)){ const d = cleanDay(raw.days[k]); if(d) s.days[k] = d; }
  return s;
}
// Accepts both the raw state and a backup file ({app, exported, data}).
function parseStore(text){ try{ const o = JSON.parse(text); return sanitize(isObj(o) && isObj(o.data) ? o.data : o); }catch(e){ return null; } }
let store = blank();
try{ const s = parseStore(localStorage.getItem(LS)); if(s) store = s; }catch(e){}
let saveFailed = false;
function persist(){
  try{ localStorage.setItem(LS, JSON.stringify(store)); saveFailed = false; }
  catch(e){ if(!saveFailed){ saveFailed = true; toast("Не получилось сохранить прогресс на этом устройстве"); } }
}
function save(){ store.ts = Date.now(); persist(); }
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); }catch(e){}
const nSets = d => d && d.sets ? Object.keys(d.sets).length : 0;
const idle = () => !ui.player && !ui.runner && !ui.sheet;
window.addEventListener("storage", e => { if(e.key === LS && e.newValue && idle()){ const s = parseStore(e.newValue); if(s){ store = s; applyTheme(); render(); } } });
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState !== "visible") return;
  if(ui.player || ui.runner) keepAwake(); else if(!ui.sheet) render();
});

/* ================= derived ================= */
const ui = {view:"today", day:null, imp:null, update:null, updating:false, allAwards:false, pick:null, player:null, runner:null, sheet:null, onb:{place:"home",exp:"new",band:false}, cal:null, reset:false, dueSig:""};
const P = () => store.profile;
function ladder(move, place){ const m = MOVES[move]; if(place === "travel" && m.band && P().band) return m.band; return m[place]; }
function stepIdx(move, place){ const l = ladder(move, place), i = (store.prog[place]||{})[move]||0; return Math.min(Math.max(i,0), l.length-1); }
const exFor = (move, place) => ladder(move, place)[stepIdx(move, place||P().place)];
function setStep(move, place, i){ (store.prog[place] || (store.prog[place] = {}))[move] = i; }
const dayRec = () => store.days[today()] || {};
function ensureDay(){ const k = today(); return store.days[k] || (store.days[k] = {}); }
function curW(){ const d = dayRec(); if(d.w) return d.w; return ui.pick || PLAN[new Date().getDay()]; }
function curRounds(){ const d = dayRec(); return d.rounds || P().rounds; }
function orderFor(w, R){ const out = []; W[w].blocks.forEach((bl,b) => { for(let r=0;r<R;r++) bl.forEach((move,i) => out.push({b,r,i,move,k:b+"-"+r+"-"+i})); }); return out; }
function tgt(ex){ const e = EX[ex]; if(e.u === "sec") return e.r[0]+"–"+e.r[1]+" секунд"; return e.r[0]+"–"+e.r[1]+" повторов"+(e.side?" на каждую сторону":""); }
function unitLabel(ex){ const e = EX[ex]; return e.u === "sec" ? "секунд" : e.side ? "повторов на сторону" : "повторов"; }
function effort(ex){ const e = EX[ex]; if(e.u === "sec") return "Держи, пока получается сохранять ровное тело."; if(e.w) return "Остановись, когда в запасе остаётся 1–2 повтора."; return "Делай почти до предела: в запасе 0–1 повтор."; }
function defReps(ex, r){ const a = store.last[ex]; if(a){ if(a[r] != null) return a[r]; for(let i=a.length-1;i>=0;i--) if(a[i] != null) return a[i]; } return EX[ex].r[0]; }
const kgOf = ex => EX[ex].w ? (store.kg[ex] != null ? store.kg[ex] : EX[ex].kg0) : 0;
const sessOf = d => d ? (d.more||[]).concat([d]) : [];                 // all workouts of a day, the current one last
const sessXp = x => nSets(x)*XP.set + (x.done?XP.workout:0) + (x.warm?XP.warm:0) + (x.pr||0)*XP.pr + (x.up||0)*XP.up;
const dayXp = d => sessOf(d).reduce((a,x) => a+sessXp(x), 0);
const daySets = d => sessOf(d).reduce((a,x) => a+nSets(x), 0);
const doneOf = d => sessOf(d).filter(x => x.done);
const sessMin = x => x.end && x.start ? Math.max(1, Math.round((x.end-x.start)/60000)) : 0;
function archiveSession(d){ const s = {}; SESS.forEach(k => { if(d[k] !== undefined){ s[k] = d[k]; delete d[k]; } }); (d.more || (d.more = [])).push(s); }
function restoreSession(d){ if(!d.more || !d.more.length) return; SESS.forEach(k => { delete d[k]; }); Object.assign(d, d.more.pop()); if(!d.more.length) delete d.more; }
const selDay = () => ui.day || today();
const dayDiff = k => Math.round((parseKey(k)-parseKey(today()))/864e5);

function compute(opt){
  opt = opt || {};
  const s = {xp:0,workouts:0,sets:0,tasks:0,prs:0,ups:0,travel:0,tz:{},early:0,comeback:0,r3:0,weeks:{},goalWeeks:0,fullWeeks:0,bodyWeeks:0,streak:0,best:0};
  let lastDone = null;
  Object.keys(store.days).sort().forEach(k => {
    const d = store.days[k]; if(!d) return;
    const wk = keyOf(mondayOf(parseKey(k))), w = s.weeks[wk] || (s.weeks[wk] = {n:0,vol:{}});
    const tn = d.tasks ? Object.keys(d.tasks).length : 0; s.tasks += tn; s.xp += tn*XP.task;
    (d.more||[]).concat(opt.skipWorkout === k ? [] : [d]).forEach(x => {    // skipWorkout leaves out the current workout only
      const keys = x.sets ? Object.keys(x.sets) : [];
      s.sets += keys.length; s.xp += sessXp(x); s.prs += x.pr||0; s.ups += x.up||0;
      keys.forEach(sk => { const e = EX[x.sets[sk][0]]; if(!e) return; w.vol[e.g] = (w.vol[e.g]||0)+1; const sec = SEC[e.m]; if(sec) for(const g in sec) w.vol[g] = (w.vol[g]||0)+sec[g]; });
      if(x.done){
        s.workouts++; w.n++;
        if(x.place === "travel") s.travel++;
        if(x.tz != null) s.tz[x.tz] = 1;
        if(x.start && new Date(x.start).getHours() < 8) s.early++;
        if(lastDone && (parseKey(k)-parseKey(lastDone))/864e5 >= 7) s.comeback++;
        lastDone = k;
        if((x.rounds||0) >= 3) s.r3++;
      }
    });
  });
  const wks = Object.keys(s.weeks).sort(); let run = 0, prev = null;
  wks.forEach(wk => { const w = s.weeks[wk];
    if(w.n >= 3){ s.goalWeeks++; s.xp += XP.week; run = (prev && Math.round((parseKey(wk)-parseKey(prev))/864e5) === 7) ? run+1 : 1; prev = wk; s.best = Math.max(s.best, run); }
    if(w.n >= 6){ s.fullWeeks++; s.xp += XP.week; }
    if(GROUPS.every(g => (w.vol[g[0]]||0) >= MIN_SETS)){ s.bodyWeeks++; s.xp += XP.week; } });
  const c = mondayOf(new Date()); if(!(s.weeks[keyOf(c)] && s.weeks[keyOf(c)].n >= 3)) c.setDate(c.getDate()-7);
  while(s.weeks[keyOf(c)] && s.weeks[keyOf(c)].n >= 3){ s.streak++; c.setDate(c.getDate()-7); }
  s.tzN = Object.keys(s.tz).length;
  s.week = s.weeks[keyOf(mondayOf(new Date()))] || {n:0,vol:{}};
  s.lvl = levelOf(s.xp);
  s.awards = AWARDS.map(a => { const v = Math.min(a.f(s), a.t); return {id:a.id, n:a.n, d:a.d, i:a.i, v, t:a.t, on:v >= a.t}; });
  return s;
}
const AWARDS = [
  {id:"first",n:"Первый шаг",d:"Первая тренировка",i:"star",t:1,f:s=>s.workouts},
  {id:"w3",n:"Неделя в зачёт",d:"3 тренировки за неделю",i:"cal",t:1,f:s=>s.goalWeeks},
  {id:"body",n:"Всё тело",d:"Все 6 групп мышц получили минимум за неделю",i:"body",t:1,f:s=>s.bodyWeeks},
  {id:"w6",n:"Полная неделя",d:"6 тренировок за неделю",i:"bolt",t:1,f:s=>s.fullWeeks},
  {id:"n10",n:"Десятка",d:"10 тренировок",i:"db",t:10,f:s=>s.workouts},
  {id:"n25",n:"Четверть сотни",d:"25 тренировок",i:"db",t:25,f:s=>s.workouts},
  {id:"n50",n:"Полсотни",d:"50 тренировок",i:"cup",t:50,f:s=>s.workouts},
  {id:"n100",n:"Сотня",d:"100 тренировок",i:"cup",t:100,f:s=>s.workouts},
  {id:"s4",n:"Месяц подряд",d:"Серия 4 недели",i:"flame",t:4,f:s=>s.best},
  {id:"s8",n:"Два месяца подряд",d:"Серия 8 недель",i:"flame",t:8,f:s=>s.best},
  {id:"s12",n:"Привычка",d:"Серия 12 недель",i:"flame",t:12,f:s=>s.best},
  {id:"up1",n:"Сложнее",d:"Первый переход на новую ступень или вес",i:"up",t:1,f:s=>s.ups},
  {id:"up5",n:"Пять ступеней",d:"5 переходов на новую ступень или вес",i:"up",t:5,f:s=>s.ups},
  {id:"pr1",n:"Личный рекорд",d:"Первый рекорд в упражнении",i:"star",t:1,f:s=>s.prs},
  {id:"pr25",n:"Коллекция рекордов",d:"25 личных рекордов",i:"star",t:25,f:s=>s.prs},
  {id:"r3",n:"Три круга",d:"Тренировка в три круга",i:"rep",t:1,f:s=>s.r3},
  {id:"set500",n:"500 подходов",d:"500 подходов за всё время",i:"bolt",t:500,f:s=>s.sets},
  {id:"trav",n:"Чемодан",d:"5 тренировок в поездке",i:"bag",t:5,f:s=>s.travel},
  {id:"tz",n:"Три часовых пояса",d:"Тренировки в трёх часовых поясах",i:"globe",t:3,f:s=>s.tzN},
  {id:"early",n:"Жаворонок",d:"5 тренировок до 8 утра",i:"sun",t:5,f:s=>s.early},
  {id:"back",n:"Возвращение",d:"Тренировка после перерыва в неделю и больше",i:"rep",t:1,f:s=>s.comeback},
  {id:"t10",n:"Свои правила",d:"10 выполненных заданий",i:"wave",t:10,f:s=>s.tasks},
  {id:"t50",n:"Ритуал",d:"50 выполненных заданий",i:"wave",t:50,f:s=>s.tasks},
  {id:"t200",n:"Образ жизни",d:"200 выполненных заданий",i:"wave",t:200,f:s=>s.tasks}
];
function celebrate(before, after){
  if(after.lvl.l > before.lvl.l) toast("Новый уровень: "+after.lvl.l+" · "+after.lvl.name, true);
  after.awards.forEach((a,i) => { if(a.on && !before.awards[i].on) toast("Награда: "+a.n, true); });
}

/* ================= figures ================= */
const NS = "http://www.w3.org/2000/svg";
let figs = [];
const io = ("IntersectionObserver" in window) ? new IntersectionObserver(es => es.forEach(en => { const f = figs.find(x => x.svg === en.target); if(f) f.vis = en.isIntersecting; })) : null;
function el(tag, attrs, parent){ const n = document.createElementNS(NS, tag); for(const a in attrs) n.setAttribute(a, attrs[a]); parent.appendChild(n); return n; }
const figSvg = ex => '<svg class="fig" data-ex="'+ex+'" viewBox="18 0 176 136" role="img" aria-label="Как выглядит: '+esc(EX[ex].n)+'"></svg>';
function mountFigs(){
  figs = figs.filter(f => { if(f.svg.isConnected) return true; if(io) io.unobserve(f.svg); return false; });
  document.querySelectorAll("svg.fig:not([data-m])").forEach(svg => {
    const e = EX[svg.dataset.ex]; if(!e) return;
    svg.setAttribute("data-m","1");
    const hot = HOT[e.m];
    el("line",{x1:18,y1:131,x2:194,y2:131,class:"floor"},svg);
    if(e.box) el("rect",{x:e.box[0],y:e.box[1],width:e.box[2],height:e.box[3],rx:3,class:"box"},svg);
    const line = (cls,w) => el("polyline",{class:cls,"stroke-width":w,"stroke-linecap":"round","stroke-linejoin":"round"},svg);
    const band = e.prop === "band" ? el("polyline",{class:"band","stroke-linecap":"round"},svg) : null;
    const q = {farLeg:line("far",7), farArm:line("far",7)};
    const p2 = e.prop === "db2" ? el("rect",{width:14,height:7,rx:2,class:"prop",opacity:.6},svg) : null;
    q.torso = line("near"+(hot === "torso" ? " hot" : ""),9); q.nearLeg = line("near"+(hot === "leg" ? " hot" : ""),7);
    q.head = el("circle",{r:8,class:"head"},svg); q.nearArm = line("near"+(hot === "arm" ? " hot" : ""),7);
    const p1 = (e.prop === "db" || e.prop === "db2") ? el("rect",{width:14,height:7,rx:2,class:"prop"},svg) : e.prop === "bag" ? el("rect",{width:18,height:22,rx:5,class:"prop"},svg) : null;
    const f = {svg, e, pose:POSES[e.p], q, p1, p2, band, vis:!io};
    figs.push(f); drawFig(f, reduce ? 1 : 0);
    if(io) io.observe(svg);
  });
}
const pt = a => a[0]+","+a[1];
function drawFig(f, t){
  const p = mix(f.pose.a, f.pose.b, t), q = f.q;
  q.farLeg.setAttribute("points", [p.p,p.k2,p.f2].map(pt).join(" "));
  q.farArm.setAttribute("points", [p.s,p.e2,p.w2].map(pt).join(" "));
  q.torso.setAttribute("points", [p.s,p.p].map(pt).join(" "));
  q.nearLeg.setAttribute("points", [p.p,p.k1,p.f1].map(pt).join(" "));
  q.nearArm.setAttribute("points", [p.s,p.e1,p.w1].map(pt).join(" "));
  q.head.setAttribute("cx", p.h[0]); q.head.setAttribute("cy", p.h[1]);
  if(f.p1){
    if(f.e.prop === "bag"){ f.p1.setAttribute("x", p.w1[0]-9); f.p1.setAttribute("y", p.w1[1]+2); }
    else if(f.e.at === "p"){ f.p1.setAttribute("x", p.p[0]-3); f.p1.setAttribute("y", p.p[1]-13); }
    else { f.p1.setAttribute("x", p.w1[0]-7); f.p1.setAttribute("y", p.w1[1]-3.5); }
  }
  if(f.p2){ f.p2.setAttribute("x", p.w2[0]-7); f.p2.setAttribute("y", p.w2[1]-3.5); }
  if(f.band) f.band.setAttribute("points", [p.w1,[p.f1[0],129],p.w2].map(pt).join(" "));
}
let lastFrame = 0;
function loop(ts){
  if(ts - lastFrame > 33){
    lastFrame = ts;
    const c = (ts % 3000)/3000;                // 3 s cycle: hold, move, hold, return
    let t = c < .15 ? 0 : c < .5 ? (c-.15)/.35 : c < .65 ? 1 : 1-(c-.65)/.35;
    t = t*t*(3-2*t);
    figs.forEach(f => { if(f.vis) drawFig(f, t); });
  }
  requestAnimationFrame(loop);
}
if(!reduce) requestAnimationFrame(loop);

/* ================= sound, wake lock, toasts ================= */
let actx = null, wake = null;
function audioOn(){ try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); if(actx.state === "suspended") actx.resume(); }catch(e){} }
function beep(n){
  if(P().sound !== false){ try{ if(actx) (n === 1 ? [0] : [0,.22]).forEach(dt => {
    const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
    const t0 = actx.currentTime + dt; g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.3,t0+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+.16);
    o.start(t0); o.stop(t0+.18); }); }catch(e){} }
  try{ if(navigator.vibrate) navigator.vibrate(n === 1 ? 120 : [200,100,200]); }catch(e){}
}
async function keepAwake(){ try{ if(!wake && navigator.wakeLock){ wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } }catch(e){} }
function letSleep(){ try{ if(wake) wake.release(); }catch(e){} wake = null; }
function toast(text, gold){
  const t = document.createElement("div"); t.className = "toast"+(gold?" gold":""); t.textContent = text;
  $("toasts").appendChild(t); setTimeout(() => t.remove(), gold ? 4200 : 2600);
}

/* ================= theme, install, backup ================= */
function chrome(){   // colour of the phone's status bar area follows the screen that is open
  const m = $("theme-color"); if(!m) return;
  const t = P().theme, dark = t === "dark" || (t !== "light" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  let c = dark ? "#0B111F" : "#EEF1F7";
  if(ui.runner) c = dark ? "#18213D" : "#0F1830"; else if(ui.player && ui.player.phase === "rest") c = "#1D4FD8";
  if(m.getAttribute("content") !== c) m.setAttribute("content", c);
}
function applyTheme(){
  const t = P().theme, r = document.documentElement;
  if(t === "light" || t === "dark") r.setAttribute("data-theme", t); else r.removeAttribute("data-theme");
  chrome();
}
try{ window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", chrome); }catch(e){}
let deferredInstall = null;
const isStandalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isTouch = isIOS || /Android/.test(navigator.userAgent);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if(idle()) render(); });
window.addEventListener("appinstalled", () => { deferredInstall = null; P().inst = true; save(); toast("Приложение установлено"); if(idle()) render(); });
function installHow(){
  if(deferredInstall) return '<button class="btn" data-act="install">Установить</button>';
  if(isIOS) return '<p class="small">На айфоне: открой эту страницу в Safari, нажми «Поделиться» и выбери «На экран „Домой“».</p>';
  return '<p class="small">В меню браузера выбери «Установить приложение» или «Добавить на главный экран».</p>';
}
function exportData(){
  const name = "korotkie-trenirovki-"+today()+".json", text = JSON.stringify({app:"korotkie-trenirovki", exported:new Date().toISOString(), data:store});
  try{
    if(isTouch && navigator.canShare){
      const file = new File([text], name, {type:"application/json"});
      if(navigator.canShare({files:[file]})){ navigator.share({files:[file], title:"Короткие тренировки: копия прогресса"}).catch(() => {}); return; }
    }
  }catch(e){}
  try{
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], {type:"application/json"}));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast("Копия сохранена в загрузки");
  }catch(e){ toast("Не получилось сохранить копию"); }
}
(function(){
  const f = $("import-file"); if(!f) return;
  f.addEventListener("change", () => {
    const file = f.files && f.files[0]; if(!file) return;
    if(file.size > 5e6){ toast("Файл слишком большой для копии"); return; }
    const r = new FileReader();
    r.onload = () => {
      const s = parseStore(String(r.result));
      if(!s){ toast("Это не файл копии приложения"); return; }
      if(!P().onb && !Object.keys(store.days).length){ store = s; save(); applyTheme(); toast("Копия загружена"); }   // nothing to lose on a fresh install
      else { ui.imp = s; ui.reset = false; }
      render();
    };
    r.onerror = () => toast("Не получилось прочитать файл");
    r.readAsText(file);
  });
})();

/* ================= views ================= */
const app = $("app");
function ring(n, pct, size, id){
  const C = 263.9, a = Math.max(0, Math.min(1, pct))*C;
  return '<svg class="ring" viewBox="0 0 100 100" style="width:'+size+'px;height:'+size+'px" role="img" aria-label="Уровень '+n+'"><circle class="trk" cx="50" cy="50" r="42"></circle><circle class="arc"'+(id?' id="'+id+'"':'')+' cx="50" cy="50" r="42" stroke-dasharray="'+a.toFixed(1)+' '+C+'" transform="rotate(-90 50 50)"></circle><text x="50" y="65" text-anchor="middle">'+n+'</text></svg>';
}
const DOW_FULL = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const ORD = ["","Вторая","Третья","Четвёртая","Пятая"];
function rangeText(m){
  const e = new Date(m); e.setDate(m.getDate()+6);
  const dm = d => d.toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
  return m.getMonth() === e.getMonth() ? m.getDate()+"–"+dm(e) : dm(m)+" – "+dm(e);
}
// The week of the selected day. Tapping a day shows that day below; the arrows move a week back or forward.
function weekStrip(s){
  const sel = selDay(), tk = today(), m = mondayOf(parseKey(sel)), off = Math.round((m-mondayOf(new Date()))/6048e5);
  let h = '<div class="weekbox"><div class="week" role="group" aria-label="Дни недели">';
  for(let i=0;i<7;i++){
    const d = new Date(m); d.setDate(m.getDate()+i);
    const k = keyOf(d), l = store.days[k], nd = doneOf(l).length, p = (l && l.w) || PLAN[d.getDay()];
    let cls = "day"; if(k === tk) cls += " today";
    if(nd) cls += " done"; else if(daySets(l)) cls += " part";
    if(!p && !nd) cls += " rest";
    const what = nd ? "сделано" : p ? "тренировка "+p : "отдых";
    h += '<button class="'+cls+'" data-act="day" data-k="'+k+'" aria-pressed="'+(k===sel)+'" aria-label="'+DOW_FULL[d.getDay()]+', '+d.getDate()+': '+what+'">'+
      '<span class="d">'+DOW[d.getDay()]+' '+d.getDate()+'</span><span class="w">'+(nd > 1 ? "×"+nd : nd ? ico("check") : (p||"отдых"))+'</span></button>';
  }
  const n = (s.weeks[keyOf(m)] || {n:0}).n, cnt = n+' '+pl(n,"тренировка","тренировки","тренировок");
  let a, b = "";
  if(off === 0){
    a = n >= 3 ? 'Неделя в зачёте: <b>'+cnt+'</b>' : 'На этой неделе <b>'+n+' из 3</b> тренировок';
    if(s.streak) b = '<span class="streak">'+ico("flame")+'серия '+s.streak+' '+pl(s.streak,"неделя","недели","недель")+'</span>';
  } else {
    a = '<b>'+esc(rangeText(m))+'</b>';
    b = '<span class="muted">'+(off > 0 ? "по плану 6 тренировок" : cnt)+'</span>';
  }
  return h+'</div><div class="weeknav"><button class="iconbtn flip" data-act="week" data-v="-1" aria-label="Предыдущая неделя">'+ico("chev")+'</button>'+
    '<div class="small num"><span>'+a+'</span>'+b+'</div><button class="iconbtn" data-act="week" data-v="1" aria-label="Следующая неделя">'+ico("chev")+'</button></div></div>';
}
function exRow(move, place){
  const ex = exFor(move, place), e = EX[ex];
  return '<button class="exrow" data-act="info" data-ex="'+ex+'" data-move="'+move+'">'+figSvg(ex)+
    '<span class="stack" style="gap:2px"><span class="nm">'+esc(e.n)+'</span><span class="small muted">'+tgt(ex)+(e.w?" · "+kgOf(ex)+" кг":"")+'</span></span>'+ico("chev")+'</button>';
}
function taskSub(t){ return t.kind === "breath" ? "Дыхание · "+t.min+" мин" : t.kind === "timer" ? "Таймер · "+t.min+" мин" : "Отметка"; }
function daysText(t){ const a = t.days||[]; if(a.length === 7) return "каждый день"; if(a.length === 5 && [1,2,3,4,5].every(x => a.indexOf(x) >= 0)) return "по будням"; return WEEK.filter(x => a.indexOf(x) >= 0).map(x => DOW[x]).join(", "); }
const tasksFor = dow => store.tasks.filter(t => (t.days||[]).indexOf(dow) >= 0).sort((a,b) => (a.time||"").localeCompare(b.time||""));
const todaysTasks = () => tasksFor(new Date().getDay());
function nowHM(){ const n = new Date(); return pad(n.getHours())+":"+pad(n.getMinutes()); }
function tasksCard(){
  const list = todaysTasks(), done = dayRec().tasks || {}, hm = nowHM();
  let h = '<div class="rowb"><h2>Задания на сегодня</h2><button class="btn sm ghost" data-act="task-new">'+ico("plus")+'Своё</button></div><section class="card list">';
  if(!list.length){
    h += '<div class="stack" style="padding:10px 0"><p class="muted small">'+(store.tasks.length ? "На сегодня заданий нет." : "Добавь то, что хочешь делать по расписанию. За каждое выполненное задание — "+XP.task+" очков.")+'</p>';
    if(!store.tasks.length) h += '<div class="chips">'+TPL.map((t,i) => '<button class="chip" data-act="task-tpl" data-i="'+i+'">'+esc(t.name)+(t.kind!=="check"?" · "+t.min+" мин":"")+'</button>').join("")+'</div>';
    h += '</div>';
  } else {
    h += '<div class="tasks">'+list.map(t => { const on = !!done[t.id], due = !on && t.time && t.time <= hm;
      return '<div class="task'+(on?" done":"")+(due?" due":"")+'"><span class="t-time num">'+esc(t.time||"")+'</span>'+
        '<button class="t-main" data-act="task-edit" data-id="'+t.id+'" aria-label="Изменить задание: '+esc(t.name)+'"><b>'+esc(t.name)+(due?'<span class="duetag">пора</span>':'')+'</b><span class="small muted">'+taskSub(t)+'</span></button>'+
        (on || t.kind === "check" ? '<button class="tick" data-act="task-toggle" data-id="'+t.id+'" aria-pressed="'+on+'" aria-label="'+(on?"Снять отметку":"Отметить")+': '+esc(t.name)+'">'+ico("check")+'</button>'
          : '<button class="btn sm'+(due?"":" ghost")+'" data-act="task-run" data-id="'+t.id+'">Начать</button>')+'</div>'; }).join("")+'</div>';
  }
  return h+'</section>';
}
function header(s){
  const sel = selDay(), df = dayDiff(sel), dt = parseKey(sel);
  const title = df === 0 ? "Сегодня" : df === 1 ? "Завтра" : df === -1 ? "Вчера" : DOW_FULL[dt.getDay()];
  const sub = Math.abs(df) <= 1 ? dt.toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})
    : dt.toLocaleDateString("ru-RU",{day:"numeric",month:"long"})+(dt.getFullYear() !== new Date().getFullYear() ? " "+dt.getFullYear() : "");
  return '<header class="top"><div><div class="date">'+esc(sub)+'</div><h1>'+title+'</h1></div>'+
    '<button class="lvlchip" data-act="nav" data-view="progress" aria-label="Уровень '+s.lvl.l+', '+esc(s.lvl.name)+'. Открыть прогресс">'+
    (df === 0 ? '<span><b>'+esc(s.lvl.name)+'</b><span class="small muted num">'+s.xp+' '+pl(s.xp,"очко","очка","очков")+'</span></span>' : '')+ring(s.lvl.l, s.lvl.pct, 56)+'</button></header>';
}
function setsList(x){
  const by = {}, names = [];
  Object.keys(x.sets||{}).sort().forEach(sk => { const v = x.sets[sk]; if(!EX[v[0]]) return; if(!by[v[0]]){ by[v[0]] = []; names.push(v[0]); } by[v[0]].push(v); });
  return '<div class="setlist">'+names.map(ex => '<div><span>'+esc(EX[ex].n)+'</span><b class="num">'+by[ex].map(v => v[1]).join(", ")+(EX[ex].u === "sec" ? " с" : "")+(EX[ex].w && by[ex][0][2] ? " × "+nf(by[ex][0][2])+" кг" : "")+'</b></div>').join("")+'</div>';
}
function dayTasksCard(k, df){
  if(df < 0){
    const done = (store.days[k]||{}).tasks || {}, ids = Object.keys(done).sort((a,b) => done[a]-done[b]); if(!ids.length) return "";
    return '<h2>Выполненные задания</h2><section class="card list"><div class="tasks">'+ids.map(id => { const t = store.tasks.find(x => x.id === id), tm = new Date(done[id]);
      return '<div class="task"><span class="t-time num">'+pad(tm.getHours())+':'+pad(tm.getMinutes())+'</span><div class="t-main"><b>'+esc(t ? t.name : "Удалённое задание")+'</b></div><span class="okmark">'+ico("check")+'</span></div>'; }).join("")+'</div></section>';
  }
  const list = tasksFor(parseKey(k).getDay()); if(!list.length) return "";
  return '<h2>Задания на этот день</h2><section class="card list"><div class="tasks">'+list.map(t =>
    '<div class="task"><span class="t-time num">'+esc(t.time||"")+'</span><div class="t-main"><b>'+esc(t.name)+'</b><span class="small muted">'+taskSub(t)+'</span></div><span></span></div>').join("")+'</div></section>';
}
// Any day other than today: what was done (past) or what is planned (future).
function viewDay(k){
  const df = dayDiff(k), d = store.days[k], place = P().place, plan = PLAN[parseKey(k).getDay()];
  let h = "";
  if(df < 0){
    const ss = sessOf(d).filter(x => x.w && nSets(x));
    ss.forEach(x => { const n = nSets(x), mins = sessMin(x);
      h += '<section class="card"><div class="stack" style="gap:2px"><span class="eyebrow">'+(x.done ? "Сделано" : "Не закончена")+' · тренировка '+x.w+'</span><h2>'+esc(W[x.w].n)+'</h2>'+
        '<span class="small muted num">'+n+' '+pl(n,"подход","подхода","подходов")+(mins ? " за "+mins+" мин" : "")+' · +'+sessXp(x)+' очков</span></div>'+setsList(x)+'</section>'; });
    if(!ss.length) h += '<section class="card"><div class="stack" style="gap:4px"><span class="eyebrow">'+(plan ? "По плану была тренировка "+plan : "День отдыха")+'</span><h2>Без тренировки</h2>'+
      '<span class="small muted">'+(plan ? "Ничего страшного: важна нагрузка за неделю, а не каждый день." : "Отдых — часть плана.")+'</span></div></section>';
  } else if(plan){
    const R = P().rounds, n = R*4;
    h += '<section class="hero panelbg"><span class="eyebrow">По плану · тренировка '+plan+' · '+(R*5)+' минут</span><div class="hero-top"><div class="stack"><h2>'+esc(W[plan].n)+'</h2>'+
      '<span class="small">4 упражнения, '+n+' '+pl(n,"подход","подхода","подходов")+'</span></div>'+figSvg(exFor(W[plan].blocks[0][0], place))+'</div>'+
      '<button class="btn white wide" data-act="do-today" data-w="'+plan+'">Сделать сегодня</button></section>'+
      '<section class="card list"><div class="exlist">'+W[plan].blocks.map(bl => bl.map(m => exRow(m, place)).join("")).join("")+'</div></section>';
  } else {
    h += '<section class="hero panelbg"><div class="stack"><span class="eyebrow">По плану</span><h2>День отдыха</h2><span class="small">Мышцы растут, пока отдыхают. Тренировку можно сделать и в этот день: она пойдёт в зачёт недели.</span></div></section>';
  }
  return h + dayTasksCard(k, df) + '<button class="btn ghost wide" data-act="day" data-k="'+today()+'">Вернуться к сегодня</button>';
}
function viewToday(){
  const s = compute(), sel = selDay();
  let h = header(s) + weekStrip(s);
  if(sel !== today()) return h + viewDay(sel);
  const d = dayRec(), w = curW(), place = P().place, extra = (d.more||[]).length;
  const live = w && !d.done, started = nSets(d) > 0;
  if(!w){
    h += '<section class="hero panelbg"><div class="stack"><span class="eyebrow">День отдыха</span><h2>Мышцы растут, пока отдыхают</h2><span class="small">Пропустил день на неделе? Можно сделать тренировку сегодня.</span></div>'+
      '<div class="chips">'+["A","B","C"].map(x => '<button class="chip" data-act="pick" data-w="'+x+'">'+x+' · '+esc(W[x].n)+'</button>').join("")+'</div></section>';
  } else if(d.done){
    const n = daySets(d), mins = sessOf(d).reduce((a,x) => a+sessMin(x), 0);
    const t = new Date(); t.setDate(t.getDate()+1); const nw = PLAN[t.getDay()];
    h += '<section class="hero okbg"><div class="stack"><span class="eyebrow">Сегодня сделано · '+(extra ? (extra+1)+" "+pl(extra+1,"тренировка","тренировки","тренировок") : "тренировка "+w)+'</span><h2>'+esc(W[w].n)+'</h2>'+
      '<span class="num">'+n+' '+pl(n,"подход","подхода","подходов")+(mins?" за "+mins+" мин":"")+' · +'+dayXp(d)+' очков</span>'+
      '<span class="small">'+(nw ? "Завтра: тренировка "+nw+" · "+esc(W[nw].n) : "Завтра день отдыха")+'</span></div>'+
      '<div class="stack"><button class="btn big white" data-act="start">Итоги</button><button class="btn line" data-act="again">Ещё одна тренировка</button></div></section>';
  } else {
    const R = curRounds(), order = orderFor(w, R), doneN = order.filter(o => d.sets && d.sets[o.k]).length;
    const nextStep = order.find(o => !(d.sets && d.sets[o.k])) || order[0];
    h += '<section class="hero"><span class="eyebrow">'+(extra ? (ORD[extra] || (extra+1)+"-я")+" тренировка · " : "Тренировка ")+w+' · '+(R*5)+' минут</span><div class="hero-top"><div class="stack"><h2>'+esc(W[w].n)+'</h2>'+
      '<span class="small">'+(started ? "Сделано "+doneN+" из "+order.length+" подходов" : "4 упражнения, "+order.length+" "+pl(order.length,"подход","подхода","подходов"))+'</span></div>'+figSvg(exFor(nextStep.move, place))+'</div>'+
      '<div class="seg" role="group" aria-label="Где тренируешься">'+
        '<button data-act="place" data-v="home" aria-pressed="'+(place==="home")+'">Дома с гантелями</button>'+
        '<button data-act="place" data-v="travel" aria-pressed="'+(place==="travel")+'">В поездке</button></div>'+
      '<div class="seg" role="group" aria-label="Длительность">'+[1,2,3].map(n => '<button data-act="rounds" data-v="'+n+'" aria-pressed="'+(R===n)+'" aria-label="'+(n*5)+' минут, '+n+' '+pl(n,"круг","круга","кругов")+'">'+(n*5)+' минут</button>').join("")+'</div>'+
      '<button class="btn big gold" data-act="start">'+(started ? "Продолжить" : "Начать")+'</button></section>';
  }
  if(live){
    h += '<section class="card list"><div class="exlist">'+W[w].blocks.map(bl => bl.map(m => exRow(m, place)).join("")).join("")+'</div></section>';
    if(!started) h += '<div class="rowb"><span class="small muted">Другая тренировка</span><div class="chips" role="group" aria-label="Другая тренировка">'+["A","B","C"].map(x => '<button class="chip" data-act="pick" data-w="'+x+'" aria-pressed="'+(x===w)+'" aria-label="Тренировка '+x+': '+esc(W[x].n)+'">'+x+'</button>').join("")+'</div></div>';
    if(extra && !started) h += '<div class="rowb"><span class="small muted">Сегодня уже сделано: '+d.more.map(x => x.w).join(", ")+'</span><button class="link" data-act="again-no">На сегодня хватит</button></div>';
    if(!started && P().rounds < 3 && s.workouts >= 6 && !P().hint3)
      h += '<div class="hint"><b>Готов к пятнадцати минутам?</b><span>Позади '+s.workouts+' '+pl(s.workouts,"тренировка","тренировки","тренировок")+'. Три круга занимают около 15 минут и дают в полтора раза больше нагрузки.</span>'+
        '<div class="chips"><button class="btn sm gold" data-act="rounds" data-v="3">Попробовать</button><button class="btn sm ghost" data-act="hint3">Не сейчас</button></div></div>';
  }
  h += tasksCard();
  if(!isStandalone() && !P().inst)
    h += '<div class="hint"><b>Поставь приложение на главный экран</b><span>Так оно открывается одним касанием, на весь экран и работает без интернета.</span>'+
      (deferredInstall ? '<div class="chips"><button class="btn sm" data-act="install">Установить</button><button class="btn sm ghost" data-act="inst-hide">Не сейчас</button></div>'
        : installHow()+'<div class="chips"><button class="btn sm ghost" data-act="inst-hide">Понятно</button></div>')+'</div>';
  return h;
}
function volumeCard(s){
  const v = s.week.vol;
  let h = '<section class="card"><div class="stack" style="gap:2px"><h2>Нагрузка за неделю</h2><span class="small muted">Подходов на группу мышц. Отметки на шкале: минимум 4 и цель 10.</span></div><div class="vol">';
  GROUPS.forEach(g => { const n = v[g[0]]||0;
    h += '<div class="vrow"><span>'+g[1]+'</span><div class="bar" role="img" aria-label="'+g[1]+': '+nf(n)+'"><i class="'+(n>=MIN_SETS?"ok":"")+'" style="width:'+Math.min(100,n/BAR_MAX*100)+'%"></i><u style="left:'+(MIN_SETS/BAR_MAX*100)+'%"></u><u style="left:'+(GOAL_SETS/BAR_MAX*100)+'%"></u></div><span class="num" style="text-align:right">'+nf(n)+'</span></div>'; });
  return h+'</div></section>';
}
function movesCard(){
  const place = P().place;
  let h = '<section class="card"><div class="stack" style="gap:2px"><h2>Мои упражнения</h2><span class="small muted">Вариант для режима «'+(place==="home"?"Дома":"В поездке")+'». Нажми, чтобы выбрать проще или сложнее.</span></div><div class="moves">';
  MOVE_ORDER.forEach(m => { const l = ladder(m, place), i = stepIdx(m, place), ex = l[i], a = store.last[ex];
    const lastTxt = a && a.length ? " · в прошлый раз "+a.filter(x => x != null).join(", ")+(EX[ex].w?" × "+kgOf(ex)+" кг":"") : "";
    h += '<button class="moverow" data-act="ladder" data-move="'+m+'"><span class="stack" style="gap:1px"><b style="font-weight:600">'+esc(EX[ex].n)+'</b><span class="small muted num">'+esc(MOVES[m].n)+lastTxt+'</span></span>'+
      '<span class="lpips" role="img" aria-label="Ступень '+(i+1)+' из '+l.length+'">'+l.map((x,j) => '<i class="'+(j<=i?"on":"")+'"></i>').join("")+'</span>'+ico("chev")+'</button>'; });
  return h+'</div></section>';
}
function calCard(){
  const now = new Date(); if(!ui.cal) ui.cal = {y:now.getFullYear(), m:now.getMonth(), sel:today()};
  const c = ui.cal, first = new Date(c.y, c.m, 1, 12), dim = new Date(c.y, c.m+1, 0).getDate(), off = (first.getDay()+6)%7, tk = today();
  let h = '<section class="card"><div class="rowb"><h2 style="text-transform:capitalize">'+esc(first.toLocaleDateString("ru-RU",{month:"long",year:"numeric"}))+'</h2><div class="chips" style="flex-wrap:nowrap">'+
    '<button class="iconbtn" data-act="cal" data-v="-1" aria-label="Предыдущий месяц" style="transform:scaleX(-1)">'+ico("chev")+'</button><button class="iconbtn" data-act="cal" data-v="1" aria-label="Следующий месяц">'+ico("chev")+'</button></div></div><div class="cal">';
  WEEK.forEach(x => h += '<span class="hd">'+DOW[x]+'</span>');
  for(let i=0;i<off;i++) h += '<span></span>';
  for(let n=1;n<=dim;n++){ const k = c.y+"-"+pad(c.m+1)+"-"+pad(n), d = store.days[k];
    const cls = (doneOf(d).length ? "done" : daySets(d) ? "part" : "")+(k===tk?" td":"")+(k===c.sel?" sel":"")+(d && d.tasks && Object.keys(d.tasks).length?" tk":"");
    h += '<button class="'+cls+'" data-act="cal-day" data-k="'+k+'">'+n+'</button>'; }
  h += '</div>';
  const d = store.days[c.sel], lbl = parseKey(c.sel).toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
  let txt = lbl+": ";
  const ss = sessOf(d).filter(x => x.w && nSets(x));
  if(ss.length){ const n = daySets(d), mins = ss.reduce((a,x) => a+sessMin(x), 0); txt += (ss.length > 1 ? "тренировки " : "тренировка ")+ss.map(x => x.w).join(" и ")+", "+n+" "+pl(n,"подход","подхода","подходов")+(mins?", "+mins+" мин":"")+(ss[ss.length-1].done?"":" (не закончена)"); }
  else txt += "без тренировки";
  const tn = d && d.tasks ? Object.keys(d.tasks).length : 0; if(tn) txt += " · "+tn+" "+pl(tn,"задание","задания","заданий");
  return h+'<div class="rowb"><p class="small muted num">'+esc(txt)+'</p><button class="link" data-act="cal-open" data-k="'+c.sel+'" style="flex:none">Открыть день</button></div></section>';
}
function viewProgress(){
  const s = compute(), got = s.awards.filter(a => a.on).length, L = s.lvl;
  const nextName = L.l < LEVELS.length ? "«"+LEVELS_GEN[L.l]+"»" : "уровня "+(L.l+1);
  let h = '<header class="top"><div><div class="date">'+(s.streak ? "Серия "+s.streak+" "+pl(s.streak,"неделя","недели","недель")+" подряд" : "Неделя идёт в зачёт с трёх тренировок")+'</div><h1>Прогресс</h1></div></header>';
  h += '<section class="panel"><div class="panel-top">'+ring(L.l, L.pct, 96)+'<div class="stack" style="gap:2px"><span class="eyebrow">Уровень '+L.l+'</span><h2>'+esc(L.name)+'</h2>'+
    '<span class="small num">'+s.xp+' '+pl(s.xp,"очко","очка","очков")+' · ещё '+(L.hi-s.xp)+' до '+nextName+'</span></div></div>'+
    '<div class="totals"><div><b>'+s.workouts+'</b><span>'+pl(s.workouts,"тренировка","тренировки","тренировок")+'</span></div><div><b>'+s.sets+'</b><span>'+pl(s.sets,"подход","подхода","подходов")+'</span></div>'+
    '<div><b>'+s.prs+'</b><span>'+pl(s.prs,"рекорд","рекорда","рекордов")+'</span></div><div><b>'+s.tasks+'</b><span>'+pl(s.tasks,"задание","задания","заданий")+'</span></div></div></section>';
  h += volumeCard(s);
  const aw = s.awards.slice().sort((a,b) => (b.on-a.on) || (b.v/b.t - a.v/a.t)), show = ui.allAwards ? aw : aw.slice(0,6);
  h += '<section class="card" style="gap:16px"><div class="rowb"><h2>Награды</h2><span class="small muted num">'+got+' из '+aw.length+'</span></div><div class="medals">'+
    show.map(a => '<div class="medal'+(a.on?" on":"")+'"><span class="m">'+ico(a.i)+'</span><b>'+esc(a.n)+'</b><span class="muted">'+esc(a.d)+(a.on||a.t===1?"":'<br><span class="num">'+a.v+" из "+a.t+'</span>')+'</span></div>').join("")+'</div>'+
    '<button class="btn ghost wide" data-act="allaw">'+(ui.allAwards ? "Свернуть" : "Все "+aw.length+" "+pl(aw.length,"награда","награды","наград"))+'</button></section>';
  h += movesCard() + calCard();
  return h;
}
function viewOptions(){
  const p = P();
  let h = '<header class="top"><div><div class="date">Как всё устроено</div><h1>Настройки</h1></div></header>';
  h += '<section class="card"><h2>Тренировка</h2>'+
    '<div class="stack"><b style="font-weight:600">Отдых после круга</b><div class="seg" role="group" aria-label="Отдых после круга">'+[45,60,90,120].map(v => '<button data-act="rest" data-v="'+v+'" aria-pressed="'+(p.rest===v)+'">'+v+' с</button>').join("")+'</div><span class="small muted">Между двумя упражнениями одной пары — 20 секунд на переход.</span></div>'+
    '<div class="toggle"><div><b style="font-weight:600">Резина-эспандер в поездке</b><div class="small muted">Тяга в поездке будет с резиной вместо рюкзака</div></div><button class="sw" data-act="band" role="switch" aria-checked="'+!!p.band+'" aria-label="Резина-эспандер в поездке"></button></div>'+
    '<div class="toggle"><div><b style="font-weight:600">Звук таймера</b><div class="small muted">Сигнал в конце отдыха</div></div><button class="sw" data-act="sound" role="switch" aria-checked="'+(p.sound!==false)+'" aria-label="Звук таймера"></button></div>'+
    '<div class="stack"><b style="font-weight:600">Оформление</b><div class="seg" role="group" aria-label="Оформление">'+[["auto","Как в телефоне"],["light","Светлое"],["dark","Тёмное"]].map(x => '<button data-act="theme" data-v="'+x[0]+'" aria-pressed="'+((p.theme||"auto")===x[0])+'">'+x[1]+'</button>').join("")+'</div></div></section>';
  if(!isStandalone()) h += '<section class="card"><h2>Приложение на телефоне</h2><p class="small muted">Установленное приложение открывается с главного экрана на весь экран и работает без интернета.</p>'+installHow()+'</section>';
  h += '<section class="card"><div class="rowb"><h2>Свои задания</h2><button class="btn sm ghost" data-act="task-new">'+ico("plus")+'Добавить</button></div>';
  h += store.tasks.length ? '<div class="tasks">'+store.tasks.slice().sort((a,b) => (a.time||"").localeCompare(b.time||"")).map(t =>
      '<div class="task"><span class="t-time num">'+esc(t.time||"")+'</span><button class="t-main" data-act="task-edit" data-id="'+t.id+'"><b>'+esc(t.name)+'</b><span class="small muted">'+taskSub(t)+' · '+daysText(t)+'</span></button><span class="muted">'+ico("chev")+'</span></div>').join("")+'</div>'
    : '<p class="small muted">Пока пусто. Задание появляется на главном экране в свои дни, а в назначенное время получает метку «пора».</p>';
  h += '<p class="small muted">Приложение не может прислать уведомление, когда оно закрыто. Чтобы не забыть, поставь напоминание в будильнике или календаре телефона.</p></section>';
  h += '<section class="card"><h2>Почему это работает</h2><ol class="rules">'+
    '<li>Важна нагрузка за неделю, а не длина одного занятия. Каждой группе мышц нужно минимум 4 подхода в неделю, хорошая цель — 10.</li>'+
    '<li>Упражнения идут парами: пока одни мышцы отдыхают, работают другие. Так тренировка занимает вдвое меньше времени.</li>'+
    '<li>С гантелями останавливайся за 1–2 повтора до предела. Без веса делай почти до предела, иначе нагрузки не хватит.</li>'+
    '<li>Сделал верхнюю границу повторов две тренировки подряд — приложение предложит вариант сложнее или вес больше.</li>'+
    '<li>Разминка — один лёгкий круг первых двух упражнений. Отдельная разминка и растяжка не обязательны.</li>'+
    '<li>Пропуск не страшен: перерыв до трёх недель почти не отнимает результат. Неделя идёт в зачёт уже с трёх тренировок.</li></ol>'+
    '<div class="small muted">Основа — обзор Iversen, Norum, Schoenfeld, Fimland в Sports Medicine, 2021. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772" target="_blank" rel="noopener">Открыть статью</a></div></section>';
  h += '<section class="card"><h2>Данные</h2><p class="small muted">Прогресс хранится только на этом устройстве, аккаунт не нужен. Сохрани копию в файл, чтобы перенести прогресс на другой телефон или не потерять его при очистке браузера.</p>';
  if(ui.imp){
    const n = Object.keys(ui.imp.days).reduce((a,k) => a+doneOf(ui.imp.days[k]).length, 0);
    h += '<div class="stack"><b>Заменить прогресс на этом устройстве копией из файла?</b><span class="small muted">В копии '+n+' '+pl(n,"тренировка","тренировки","тренировок")+'. То, что сейчас записано на этом устройстве, будет стёрто.</span>'+
      '<div class="chips"><button class="btn sm" data-act="imp-yes">Заменить</button><button class="btn sm ghost" data-act="imp-no">Отмена</button></div></div>';
  } else if(ui.reset){
    h += '<div class="stack"><b>Удалить весь прогресс, очки и задания?</b><div class="chips"><button class="btn sm" data-act="reset-yes">Удалить</button><button class="btn sm ghost" data-act="reset-no">Отмена</button></div></div>';
  } else {
    h += '<div class="two"><button class="btn ghost" data-act="export">Сохранить копию</button><button class="btn ghost" data-act="import">Загрузить копию</button></div><button class="link" data-act="reset">Стереть всё и начать заново</button>';
  }
  h += '</section>';
  h += '<section class="card"><h2>О приложении</h2><p class="small muted">Приложение не заменяет врача. Если упражнение вызывает боль, остановись. При травмах и хронических болезнях сначала посоветуйся со специалистом.</p>'+
    '<p class="small muted">Приложение ничего не знает о тебе и никуда не отправляет твои данные: всё хранится на этом устройстве.</p>'+
    '<button class="btn ghost" data-act="share">Поделиться приложением</button><span class="small muted num">Версия '+APP_VERSION+'</span></section>';
  return h;
}
function viewOnboard(){
  const o = ui.onb;
  const seg = (key, opts) => '<div class="seg" role="group">'+opts.map(x => '<button data-act="onb" data-k="'+key+'" data-v="'+x[0]+'" aria-pressed="'+(String(o[key])===x[0])+'">'+x[1]+(x[2]?'<small>'+x[2]+'</small>':'')+'</button>').join("")+'</div>';
  return '<header class="top" style="padding-top:10px"><div><div class="date">10 минут в день</div><h1>Короткие тренировки</h1></div></header>'+
    '<section class="card"><p>Каждый день одна короткая силовая тренировка из четырёх упражнений. Приложение ведёт по шагам: показывает упражнение, считает отдых и предлагает усложнить, когда ты готов.</p>'+
    '<div class="exlist">'+["squat","pushup","dbrow"].map(ex => '<div class="exrow" style="grid-template-columns:76px minmax(0,1fr)">'+figSvg(ex)+'<span class="nm">'+esc(EX[ex].n)+'</span></div>').join("")+'</div></section>'+
    '<section class="card"><div class="q"><h3>Где будешь тренироваться чаще?</h3>'+seg("place",[["home","Дома","с гантелями"],["travel","В поездках","без оборудования"]])+'<span class="small muted">Режим переключается перед каждой тренировкой.</span></div>'+
    '<div class="q"><h3>Какой у тебя опыт?</h3>'+seg("exp",[["new","Начинаю","или давно не занимался"],["reg","Занимаюсь","отжимаюсь 10 раз"]])+'</div>'+
    '<div class="q"><h3>Есть резина-эспандер?</h3>'+seg("band",[["false","Нет"],["true","Есть"]])+'<span class="small muted">С ней удобнее тренировать спину в поездке.</span></div>'+
    '<button class="btn big" data-act="onb-go">Начать</button><button class="link c" data-act="import">Уже занимался здесь? Загрузить копию прогресса</button></section>';
}
function render(){
  if(!P().onb){
    $("nav").hidden = true;
    app.innerHTML = viewOnboard();
  } else {
    $("nav").hidden = false;
    if(ui.day && ui.day === today()) ui.day = null;
    app.innerHTML = (ui.update ? '<div class="hint"><b>Вышла новая версия приложения</b><div class="chips"><button class="btn sm" data-act="update">Обновить</button></div></div>' : '')+
      (ui.view === "progress" ? viewProgress() : ui.view === "options" ? viewOptions() : viewToday());
    document.querySelectorAll("#nav button").forEach(b => b.setAttribute("aria-current", b.dataset.view === ui.view ? "page" : "false"));
  }
  ui.dueSig = dueSig();
  mountFigs();
}
function dueSig(){ const hm = nowHM(), done = dayRec().tasks || {}; return today()+"|"+todaysTasks().filter(t => !done[t.id] && t.time && t.time <= hm).map(t => t.id).join(","); }

/* ================= workout player ================= */
function openPlayer(){
  audioOn(); keepAwake();
  const d = dayRec(), w = curW(); if(!w) return;
  ui.player = {phase: d.done ? "finish" : (!nSets(d) && d.warm === undefined) ? "warm" : "ex", draft:null, counted:false};
  renderPlayer();
}
function closePlayer(){ ui.player = null; chrome(); letSleep(); $("player").hidden = true; $("player").className = "overlay"; $("player").innerHTML = ""; render(); }
function stepper(act, val, label, aria){
  return '<div class="stepper"><button data-act="'+act+'" data-v="-1" aria-label="'+aria+': меньше">−</button><div class="v"><b>'+val+'</b><span>'+label+'</span></div><button data-act="'+act+'" data-v="1" aria-label="'+aria+': больше">+</button></div>';
}
function suggestions(d){
  const out = [], place = P().place;
  [].concat.apply([], W[d.w].blocks).forEach(move => {
    const ex = exFor(move, place), e = EX[ex], l = ladder(move, place), i = stepIdx(move, place);
    if((store.top[ex]||0) >= 2){
      if(e.w) out.push({move, dir:1, title:e.n, sub:"Стало легко. Добавь вес: "+kgOf(ex)+" → "+(kgOf(ex)+e.ks)+" кг · +"+XP.up+" очков"});
      else if(i < l.length-1) out.push({move, dir:1, title:e.n, sub:"Стало легко. Следующая ступень: "+EX[l[i+1]].n.toLowerCase()+" · +"+XP.up+" очков"});
    } else if(store.low[ex]){
      if(e.w && kgOf(ex) > e.ks) out.push({move, dir:-1, title:e.n, sub:"Пока тяжело. Попробуй "+(kgOf(ex)-e.ks)+" кг"});
      else if(i > 0) out.push({move, dir:-1, title:e.n, sub:"Пока тяжело. Вариант проще: "+EX[l[i-1]].n.toLowerCase()});
    }
  });
  return out;
}
function renderPlayer(){
  const box = $("player"), p = ui.player; if(!p){ box.hidden = true; return; }
  box.hidden = false;
  const d = dayRec(), w = curW(), R = curRounds(), order = orderFor(w, R), sets = d.sets || {}, place = P().place;
  const doneN = order.filter(o => sets[o.k]).length, next = order.find(o => !sets[o.k]);
  if(!next) p.phase = "finish";
  box.className = "overlay"+(p.phase === "rest" ? " rest" : ""); chrome();
  let body = "", foot = "", label = "", ringTo = "";
  if(p.phase === "warm"){
    const a = exFor(W[w].blocks[0][0], place), b = exFor(W[w].blocks[0][1], place);
    label = "Разминка";
    body = '<div class="stack"><div class="eyebrow">Перед началом</div><h1 class="ex-title">Лёгкий круг для разминки</h1><p class="muted">Сделай по 5–6 лёгких повторов двух первых упражнений, без усилия. Этого хватит, чтобы разогреться.</p></div>'+
      '<div class="nextcard">'+figSvg(a)+'<b>'+esc(EX[a].n)+'</b></div><div class="nextcard">'+figSvg(b)+'<b>'+esc(EX[b].n)+'</b></div>';
    foot = '<button class="btn big" data-act="p-warm" data-v="1">Размялся</button><button class="link c" data-act="p-warm" data-v="0">Пропустить разминку</button>';
  } else if(p.phase === "ex" || p.phase === "hold"){
    const ex = exFor(next.move, place), e = EX[ex];
    if(!p.draft || p.draft.k !== next.k || p.draft.ex !== ex) p.draft = {k:next.k, ex, reps:defReps(ex, next.r), kg:kgOf(ex)};
    label = "Подход "+(doneN+1)+" из "+order.length+" · круг "+(next.r+1)+" из "+R;
    body = '<div class="stage">'+figSvg(ex)+'<span class="legend"><i></i>Работают '+WORK[e.g]+'</span></div>'+
      '<div class="stack" style="gap:6px"><h1 class="ex-title">'+esc(e.n)+'</h1><p class="small muted">Цель: '+tgt(ex)+'. '+effort(ex)+'</p></div>';
    if(p.phase === "hold"){
      body += '<div class="stack center" style="flex:1 0 auto"><div class="eyebrow" id="p-holdlbl">Приготовься</div><div class="count" id="p-count">'+p.draft.reps+'</div></div>';
      foot = '<button class="btn big" data-act="p-holdstop">Стоп</button>';
    } else {
      if(e.note) body += '<div class="note">'+esc(e.note)+'</div>';
      body += '<ol class="cues">'+e.cues.map((c,i) => '<li><i>'+(i+1)+'</i><span>'+esc(c)+'</span></li>').join("")+'</ol>';
      const a = store.last[ex], prev = a && a[next.r] != null ? a[next.r] : null;
      foot = '<div class="steppers'+(e.w?" two":"")+'">'+stepper("p-reps", p.draft.reps, unitLabel(ex)+(prev != null && !e.w ? " · в прошлый раз "+prev : ""), "Повторы")+
        (e.w ? stepper("p-kg", p.draft.kg, e.prop === "db2" ? "кг, каждая гантель" : "кг", "Вес") : "")+'</div>';
      foot += e.u === "sec"
        ? '<button class="btn big" data-act="p-hold">Запустить таймер</button><div class="two"><button class="link c" data-act="p-done">Сделал без таймера</button><button class="link c" data-act="ladder" data-move="'+next.move+'">Другой вариант</button></div>'
        : '<button class="btn big" data-act="p-done">Сделал</button><button class="link c" data-act="ladder" data-move="'+next.move+'">Слишком легко или тяжело? Другой вариант</button>';
    }
  } else if(p.phase === "rest"){
    const ex = exFor(next.move, place), left = Math.max(0, Math.ceil((p.rest.end-Date.now())/1000)), C = 766.5;
    const a = store.last[ex], prev = a && a[next.r] != null ? a[next.r] : null;
    label = "Сделано "+doneN+" из "+order.length;
    body = '<div class="stack center" style="flex:1 0 auto;gap:14px"><div class="timer"><svg viewBox="0 0 268 268" aria-hidden="true"><circle class="trk" cx="134" cy="134" r="122"></circle><circle class="arc" id="p-arc" cx="134" cy="134" r="122" stroke-dasharray="'+(Math.min(1, left/p.rest.total)*C).toFixed(1)+' '+C+'" transform="rotate(-90 134 134)"></circle></svg>'+
      '<div class="timer-in"><span class="eyebrow">Отдых</span><span class="count" id="p-count">'+fmt(left)+'</span></div></div><p class="small">Подыши ровно. Таймер сам переключит на упражнение.</p></div>'+
      '<div class="stack"><span class="eyebrow">Дальше · круг '+(next.r+1)+' из '+R+'</span><div class="nextcard">'+figSvg(ex)+'<span class="stack" style="gap:2px"><b>'+esc(EX[ex].n)+'</b><span class="small muted">'+tgt(ex)+(prev != null ? " · в прошлый раз "+prev : "")+'</span></span></div></div>';
    foot = '<div class="two"><button class="btn ghost" data-act="p-add">+15 секунд</button><button class="btn white" data-act="p-skip">Я готов</button></div>';
  } else {
    const before = compute({skipWorkout:today()}), after = compute(), gain = after.xp - before.xp, n = nSets(d), final = p.counted || reduce;
    const mins = d.end && d.start ? Math.max(1, Math.round((d.end-d.start)/60000)) : 0, up = after.lvl.l > before.lvl.l;
    const t = new Date(); t.setDate(t.getDate()+1); const nw = PLAN[t.getDay()];
    label = "Тренировка "+w;
    const lines = [["Подходы: "+n+" × "+XP.set, n*XP.set, 0],["Тренировка до конца", XP.workout, 0]];
    if(d.warm) lines.push(["Разминка", XP.warm, 0]);
    if(d.pr) lines.push(["Личные рекорды: "+d.pr, d.pr*XP.pr, 0]);
    if(d.up) lines.push(["Новая ступень: "+d.up, d.up*XP.up, 0]);
    if(after.goalWeeks > before.goalWeeks) lines.push(["Неделя в зачёте: 3 тренировки", XP.week, 1]);
    if(after.fullWeeks > before.fullWeeks) lines.push(["Полная неделя: 6 тренировок", XP.week, 1]);
    if(after.bodyWeeks > before.bodyWeeks) lines.push(["Все группы мышц за неделю", XP.week, 1]);
    ringTo = (after.lvl.pct*263.9).toFixed(1)+" 263.9";
    body = '<div class="goldcard"><span class="eyebrow">Тренировка '+w+' сделана</span><div class="goldrow"><span class="xptotal num" id="p-xp">+'+(final ? gain : 0)+'</span>'+
      '<span class="goldmeta num">'+pl(gain,"очко","очка","очков")+'<br>'+n+' '+pl(n,"подход","подхода","подходов")+(mins ? '<br>'+mins+' '+pl(mins,"минута","минуты","минут") : '')+'</span></div></div>'+
      '<div class="card"><div class="xplines num">'+lines.map(x => '<div'+(x[2]?' class="bonus"':'')+'><span>'+x[0]+'</span><b>+'+x[1]+'</b></div>').join("")+'</div></div>'+
      '<div class="card lvlrow">'+ring(after.lvl.l, final ? after.lvl.pct : (up ? 0 : before.lvl.pct), 64, "p-ring")+'<div class="stack" style="gap:2px"><span class="eyebrow'+(up?" new":"")+'">'+(up ? "Новый уровень" : "Уровень "+after.lvl.l)+'</span><h2>'+esc(after.lvl.name)+'</h2><span class="small muted num">Ещё '+(after.lvl.hi-after.xp)+' очков до уровня '+(after.lvl.l+1)+'</span></div></div>';
    after.awards.forEach((a,i) => { if(a.on && !before.awards[i].on) body += '<div class="newaward"><span class="m">'+ico(a.i)+'</span><div class="stack" style="gap:2px"><span class="eyebrow">Новая награда</span><h2>'+esc(a.n)+'</h2><span class="small">'+esc(a.d)+'</span></div></div>'; });
    const sg = suggestions(d);
    if(sg.length) body += '<div class="stack"><span class="eyebrow">На следующий раз</span>'+sg.map(x => '<div class="sugg"><div class="stack" style="gap:2px"><b>'+esc(x.title)+'</b><span class="small muted">'+esc(x.sub)+'</span></div><button class="btn sm'+(x.dir>0?" gold":" ghost")+'" data-act="p-sugg" data-move="'+x.move+'" data-v="'+x.dir+'">'+(x.dir>0?"Усложнить":"Упростить")+'</button></div>').join("")+'</div>';
    foot = '<p class="small muted" style="text-align:center">'+(after.streak ? "Серия: "+after.streak+" "+pl(after.streak,"неделя","недели","недель")+" подряд. " : "")+(nw ? "Завтра тренировка "+nw+"." : "Завтра день отдыха.")+'</p><button class="btn big" data-act="p-close">Готово</button>';
  }
  box.innerHTML = '<div class="p-in"><div class="p-top"><button class="iconbtn" data-act="p-close" aria-label="Закрыть тренировку">'+ico("x")+'</button>'+
    '<div class="p-prog"><div class="segs" role="img" aria-label="Сделано '+doneN+' из '+order.length+'">'+order.map(o => '<i class="'+(sets[o.k] ? "on" : (next && o.k === next.k ? "cur" : ""))+'"></i>').join("")+'</div><span class="num">'+label+'</span></div>'+
    '<button class="iconbtn" data-act="p-undo" aria-label="Отменить последний подход"'+(doneN && p.phase !== "finish" ? "" : " disabled")+'>'+ico("undo")+'</button></div>'+
    '<div class="p-body">'+body+'</div><div class="p-foot">'+foot+'</div></div>';
  mountFigs();
  if(p.phase === "finish"){
    const tok = p.tok = (p.tok||0)+1;          // a re-render cancels a running count-up
    if(!p.counted){
      p.counted = true;
      const arc = $("p-ring"), gain = compute().xp - compute({skipWorkout:today()}).xp;
      if(arc) setTimeout(() => { if(p.tok === tok) arc.setAttribute("stroke-dasharray", ringTo); }, 60);
      if(!reduce){ const t0 = performance.now(); (function up(t){ const cur = $("p-xp"); if(!cur || p.tok !== tok) return; const k = Math.min(1,(t-t0)/900); cur.textContent = "+"+Math.round(gain*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(up); })(t0); }
    }
  }
}
function markSet(reps){
  const p = ui.player, d = ensureDay(), w = curW(), R = curRounds(), order = orderFor(w, R);
  if(!d.w) d.w = w;
  d.sets = d.sets || {};
  const cur = order.find(o => !d.sets[o.k]); if(!cur) return;
  const ex = p.draft.ex, e = EX[ex], kg = e.w ? p.draft.kg : 0;
  d.sets[cur.k] = [ex, reps, kg];
  d.rounds = R; d.place = P().place; d.tz = new Date().getTimezoneOffset();
  if(!d.start) d.start = Date.now();
  (store.last[ex] || (store.last[ex] = []))[cur.r] = reps;
  if(e.w) store.kg[ex] = kg;
  const b = store.best[ex];
  if(!b) store.best[ex] = {r:reps, k:kg};
  else if(kg > b.k || (kg === b.k && reps > b.r)){
    store.best[ex] = {r:reps, k:kg};
    d.prx = d.prx || {};
    if(!d.prx[ex]){ d.prx[ex] = 1; d.pr = (d.pr||0)+1; toast("Личный рекорд: "+e.n+" · +"+XP.pr, true); }
  }
  const next = order.find(o => !d.sets[o.k]);
  if(!next){
    d.done = true; d.end = Date.now();
    [].concat.apply([], W[w].blocks).forEach((move, idx) => {
      const b2 = Math.floor(idx/2), i2 = idx%2, got = [];
      for(let r=0;r<R;r++){ const v = d.sets[b2+"-"+r+"-"+i2]; if(v) got.push(v); }
      if(!got.length || got.some(v => v[0] !== got[0][0])) return;
      const x = got[0][0], ee = EX[x];
      if(got.every(v => v[1] >= ee.r[1])) store.top[x] = (store.top[x]||0)+1; else store.top[x] = 0;
      if(got.every(v => v[1] < ee.r[0])) store.low[x] = 1; else delete store.low[x];
    });
    p.phase = "finish"; p.counted = false; beep();
  } else {
    const sec = (cur.i === 0 && next.b === cur.b && next.r === cur.r) ? 20 : (next.b !== cur.b ? 90 : P().rest);
    p.phase = "rest"; p.rest = {end:Date.now()+sec*1000, total:sec};
  }
  save(); renderPlayer();
}
function undoSet(){
  const p = ui.player, d = dayRec(); if(!p || !d.sets) return;
  const order = orderFor(curW(), curRounds()); let last = null;
  order.forEach(o => { if(d.sets[o.k]) last = o; });
  if(!last) return;
  delete d.sets[last.k]; d.done = false; delete d.end;
  p.phase = "ex"; p.draft = null; save(); renderPlayer();
}
function applySugg(move, dir){
  const place = P().place, ex = exFor(move, place), e = EX[ex], d = ensureDay();
  if(dir > 0){
    if(e.w){ store.kg[ex] = kgOf(ex)+e.ks; delete store.last[ex]; }
    else setStep(move, place, stepIdx(move, place)+1);
    store.top[ex] = 0; d.up = (d.up||0)+1;
    toast("Новая ступень · +"+XP.up, true);
  } else {
    if(e.w && kgOf(ex) > e.ks) store.kg[ex] = kgOf(ex)-e.ks; else setStep(move, place, Math.max(0, stepIdx(move, place)-1));
    delete store.low[ex];
  }
  save(); renderPlayer();
}

/* ================= custom tasks ================= */
const TPL = [{name:"Дыхание",kind:"breath",min:3,time:"08:00"},{name:"Растяжка",kind:"timer",min:5,time:"21:00"},{name:"Прогулка",kind:"timer",min:15,time:"13:00"},{name:"Стакан воды",kind:"check",min:1,time:"09:00"}];
function setTask(id, on){
  const before = compute(), d = ensureDay(); d.tasks = d.tasks || {};
  const t = store.tasks.find(x => x.id === id);
  if(on){ d.tasks[id] = Date.now(); toast("+"+XP.task+" очков · "+(t ? t.name : "задание")); } else delete d.tasks[id];
  save();
  if(on) celebrate(before, compute());
}
function openRunner(id){
  const t = store.tasks.find(x => x.id === id); if(!t) return;
  audioOn(); keepAwake();
  ui.runner = {id, kind:t.kind, name:t.name, total:t.min*60, end:Date.now()+t.min*60000, start:Date.now(), ph:"", sec:-1};
  const box = $("runner"); box.hidden = false; box.className = "overlay calm"; chrome();
  box.innerHTML = '<div class="p-in"><div class="p-top"><button class="iconbtn" data-act="r-close" aria-label="Закрыть">'+ico("x")+'</button><div class="p-prog"><div class="p-bar"><i id="r-bar" style="width:0%"></i></div><span>'+esc(t.name)+(t.time ? " · "+esc(t.time) : "")+'</span></div><span></span></div>'+
    '<div class="p-body center" style="gap:24px">'+(t.kind === "breath" ? '<div class="breath" id="r-breath"><div><div><b id="r-ph">Вдох</b><span id="r-sec" class="num"></span></div></div></div>' : '<div class="eyebrow">Осталось</div>')+
    '<div class="stack center" style="gap:4px"><div class="count'+(t.kind === "breath" ? " sm" : "")+'" id="r-count">'+fmt(t.min*60)+'</div>'+(t.kind === "breath" ? '<span class="small">Вдох носом 4 секунды, выдох 6 секунд</span>' : '')+'</div></div>'+
    '<div class="p-foot"><p class="small" style="text-align:center">За выполненное задание: +'+XP.task+' очков</p><button class="btn big line" data-act="r-done">Закончить</button></div></div>';
  tick();
}
function closeRunner(done){
  const r = ui.runner; if(!r) return;
  ui.runner = null; chrome(); letSleep(); $("runner").hidden = true; $("runner").innerHTML = "";
  if(done) setTask(r.id, true);
  render();
}
function openTaskSheet(t){
  ui.sheet = {type:"task", draft: t ? clone(t) : {id:"", name:"", kind:"check", min:3, time:"08:00", days:[1,2,3,4,5,6,0]}};
  renderSheet();
}
function readTaskForm(){ const dr = ui.sheet.draft; const n = $("t-name"), tm = $("t-time"); if(n) dr.name = n.value; if(tm) dr.time = tm.value; }

/* ================= sheets ================= */
function renderSheet(){
  const box = $("sheet"), s = ui.sheet; if(!s){ box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false; let h = "";
  const head = t => '<div class="rowb"><h2>'+t+'</h2><button class="iconbtn" data-act="sheet-close" aria-label="Закрыть">'+ico("x")+'</button></div>';
  if(s.type === "info"){
    const e = EX[s.ex];
    h = head(esc(e.n))+figSvg(s.ex)+'<p class="muted">Цель: '+tgt(s.ex)+'. '+effort(s.ex)+'</p>'+(e.note?'<div class="note">'+esc(e.note)+'</div>':'')+
      '<ol class="cues">'+e.cues.map((c,i) => '<li><i>'+(i+1)+'</i><span>'+esc(c)+'</span></li>').join("")+'</ol>'+
      (s.move ? '<button class="btn ghost wide" data-act="ladder" data-move="'+s.move+'">Выбрать вариант проще или сложнее</button>' : '');
  } else if(s.type === "ladder"){
    const place = P().place, l = ladder(s.move, place), cur = stepIdx(s.move, place);
    h = head(esc(MOVES[s.move].n))+'<p class="small muted">Режим «'+(place==="home"?"Дома":"В поездке")+'». Выбери вариант, в котором получается сделать нужное число повторов ровно и без рывков.</p>'+
      l.map((ex,i) => '<button class="steprow" data-act="choose" data-move="'+s.move+'" data-i="'+i+'" aria-pressed="'+(i===cur)+'">'+figSvg(ex)+'<span class="stack" style="gap:2px"><span class="eyebrow">Ступень '+(i+1)+'</span><b style="font-weight:600">'+esc(EX[ex].n)+'</b><span class="small muted">'+tgt(ex)+'</span></span><span class="radio"></span></button>').join("")+
      (l.length === 1 ? '<p class="small muted">Здесь прогресс идёт через вес: когда станет легко, приложение предложит добавить килограммы.</p>' : '');
  } else if(s.type === "task"){
    const dr = s.draft;
    h = head(dr.id ? "Задание" : "Новое задание")+
      '<label class="field" for="t-name">Название<input id="t-name" type="text" maxlength="40" placeholder="Например, дыхание" value="'+esc(dr.name)+'" autocomplete="off"></label>'+
      '<div class="field">Как выполнять<div class="seg" role="group">'+[["check","Отметка","просто галочка"],["timer","Таймер","обратный отсчёт"],["breath","Дыхание","вдох и выдох"]].map(x => '<button data-act="t-kind" data-v="'+x[0]+'" aria-pressed="'+(dr.kind===x[0])+'">'+x[1]+'<small>'+x[2]+'</small></button>').join("")+'</div></div>'+
      (dr.kind !== "check" ? '<div class="field">Сколько минут<div class="minrow"><button data-act="t-min" data-v="-1" aria-label="Меньше минут">−</button><b class="num" style="font-family:var(--display);font-size:30px">'+dr.min+'</b><button data-act="t-min" data-v="1" aria-label="Больше минут">+</button></div></div>' : '')+
      '<label class="field" for="t-time">Время<input id="t-time" type="time" value="'+esc(dr.time)+'"></label>'+
      '<div class="field">Дни недели<div class="days">'+WEEK.map(x => '<button data-act="t-day" data-v="'+x+'" aria-pressed="'+(dr.days.indexOf(x)>=0)+'">'+DOW[x]+'</button>').join("")+'</div></div>'+
      '<button class="btn big" data-act="t-save">Сохранить</button>'+(dr.id ? '<button class="btn ghost wide" data-act="t-del">Удалить задание</button>' : '');
  }
  box.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">'+h+'</div>';
  mountFigs();
}
function closeSheet(){ ui.sheet = null; renderSheet(); }

/* ================= timers ================= */
function tick(){
  const p = ui.player, now = Date.now();
  if(p && p.phase === "rest"){
    const left = Math.max(0, Math.ceil((p.rest.end-now)/1000)), c = $("p-count"), arc = $("p-arc");
    if(c) c.textContent = fmt(left);
    if(arc) arc.setAttribute("stroke-dasharray", (Math.max(0, Math.min(1, (p.rest.end-now)/1000/p.rest.total))*766.5).toFixed(1)+" 766.5");
    if(left === 0){ beep(); p.phase = "ex"; renderPlayer(); }
  } else if(p && p.phase === "hold"){
    const c = $("p-count"), lb = $("p-holdlbl");
    if(now < p.hold.from){ if(c) c.textContent = Math.ceil((p.hold.from-now)/1000); }
    else {
      if(!p.hold.go){ p.hold.go = true; beep(1); if(lb) lb.textContent = "Держи"; }
      const left = Math.max(0, Math.ceil((p.hold.end-now)/1000)); if(c) c.textContent = left;
      if(left === 0){ beep(); markSet(p.draft.reps); }
    }
  }
  const r = ui.runner;
  if(r){
    const left = Math.max(0, Math.ceil((r.end-now)/1000)), c = $("r-count"), bar = $("r-bar");
    if(c) c.textContent = fmt(left);
    if(bar) bar.style.width = Math.min(100, (1-left/r.total)*100)+"%";
    if(r.kind === "breath"){
      const t = ((now-r.start)/1000)%10, ph = t < 4 ? "in" : "out", sec = Math.max(1, Math.ceil(ph === "in" ? 4-t : 10-t));
      if(ph !== r.ph){ r.ph = ph; const b = $("r-breath"), lb = $("r-ph"); if(b) b.className = "breath "+ph; if(lb) lb.textContent = ph === "in" ? "Вдох" : "Выдох"; }
      if(sec !== r.sec){ r.sec = sec; const se = $("r-sec"); if(se) se.textContent = "ещё "+sec+" "+pl(sec,"секунду","секунды","секунд"); }
    }
    if(left === 0){ beep(); closeRunner(true); }
  }
  if(!p && !r && !ui.sheet && P().onb && ui.view === "today" && dueSig() !== ui.dueSig){ const was = ui.dueSig.split("|")[0]; render(); if(was === today()) beep(1); }
}
setInterval(tick, 250);

/* ================= actions ================= */
const A = {
  nav(b){ ui.view = b.dataset.view; ui.reset = false; ui.imp = null; if(ui.view === "today") ui.day = null; try{ history.replaceState(null, "", ui.view === "today" ? location.pathname+location.search : "#"+ui.view); }catch(e){} render(); window.scrollTo(0,0); },
  onb(b){ const k = b.dataset.k, v = b.dataset.v; ui.onb[k] = k === "band" ? v === "true" : v; render(); },
  "onb-go"(){
    const o = ui.onb, p = P(); p.onb = true; p.place = o.place; p.band = !!o.band; p.exp = o.exp;
    if(o.exp === "reg") for(const m in MOVES){ setStep(m,"home",MOVES[m].reg.home); setStep(m,"travel",MOVES[m].reg.travel); }
    save(); render(); window.scrollTo(0,0);
  },
  place(b){ P().place = b.dataset.v; save(); render(); },
  rounds(b){ const n = Number(b.dataset.v), d = dayRec(); P().rounds = n; if(n >= 3) P().hint3 = true; if(d.w && !d.done) d.rounds = n; save(); render(); },
  hint3(){ P().hint3 = true; save(); render(); },
  pick(b){ const d = dayRec(); if(nSets(d)) return; ui.pick = b.dataset.w; if(d.w){ d.w = ui.pick; save(); } render(); },
  start(){ openPlayer(); },
  day(b){ const k = b.dataset.k; ui.day = k === today() ? null : k; render(); },
  week(b){ const d = parseKey(selDay()); d.setDate(d.getDate()+7*Number(b.dataset.v)); const k = keyOf(d); ui.day = k === today() ? null : k; render(); },
  "cal-open"(b){ const k = b.dataset.k; ui.day = k === today() ? null : k; ui.view = "today"; try{ history.replaceState(null, "", location.pathname+location.search); }catch(e){} render(); window.scrollTo(0,0); },
  again(){   // one more workout today: the finished one is put aside, the next one in the rotation is offered
    const d = dayRec(); if(!d.done) return;
    const nxt = {A:"B",B:"C",C:"A"}[d.w] || "A";
    archiveSession(d); d.w = nxt; ui.pick = nxt; save(); render(); window.scrollTo(0,0);
  },
  "again-no"(){ const d = dayRec(); if(nSets(d) || !(d.more && d.more.length)) return; restoreSession(d); ui.pick = null; save(); render(); },
  "do-today"(b){
    const w = b.dataset.w, d = dayRec(); if(!has(W, w)) return;
    if(!d.done && nSets(d)){ toast("Сначала закончи сегодняшнюю тренировку"); ui.day = null; render(); window.scrollTo(0,0); return; }
    if(d.done) archiveSession(d);
    if(d.done !== undefined || d.w || d.more) ensureDay().w = w;
    ui.pick = w; ui.day = null; save(); render(); window.scrollTo(0,0);
  },
  theme(b){ P().theme = b.dataset.v; save(); applyTheme(); render(); },
  install(){ const e = deferredInstall; if(!e) return; deferredInstall = null; try{ e.prompt(); (e.userChoice || Promise.resolve()).then(() => render(), () => render()); }catch(err){ render(); } },
  "inst-hide"(){ P().inst = true; save(); render(); },
  "export"(){ exportData(); },
  "import"(){ const f = $("import-file"); if(f){ f.value = ""; f.click(); } },
  "imp-yes"(){ if(!ui.imp) return; store = ui.imp; ui.imp = null; ui.pick = null; ui.day = null; save(); applyTheme(); toast("Копия загружена"); render(); window.scrollTo(0,0); },
  "imp-no"(){ ui.imp = null; render(); },
  share(){
    const url = location.origin+location.pathname;
    if(navigator.share) navigator.share({title:"Короткие тренировки", text:"Силовая тренировка на 10 минут в день", url}).catch(() => {});
    else if(navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Ссылка скопирована"), () => toast(url));
    else toast(url);
  },
  update(){ const w = ui.update; if(!w) return; ui.updating = true; try{ w.postMessage("skip-waiting"); }catch(e){} },
  info(b){ ui.sheet = {type:"info", ex:b.dataset.ex, move:b.dataset.move}; renderSheet(); },
  ladder(b){ ui.sheet = {type:"ladder", move:b.dataset.move}; renderSheet(); },
  choose(b){ setStep(b.dataset.move, P().place, Number(b.dataset.i)); save(); closeSheet(); if(ui.player){ ui.player.draft = null; renderPlayer(); } else render(); },
  "sheet-close"(){ closeSheet(); },
  "p-close"(){ closePlayer(); },
  "p-warm"(b){ ensureDay().warm = b.dataset.v === "1"; if(!dayRec().w) ensureDay().w = curW(); ui.player.phase = "ex"; save(); renderPlayer(); },
  "p-reps"(b){ const dr = ui.player.draft, st = EX[dr.ex].u === "sec" ? 5 : 1; dr.reps = Math.max(st, dr.reps + Number(b.dataset.v)*st); renderPlayer(); },
  "p-kg"(b){ const dr = ui.player.draft; dr.kg = Math.max(1, dr.kg + Number(b.dataset.v)); renderPlayer(); },
  "p-done"(){ markSet(ui.player.draft.reps); },
  "p-hold"(){ const p = ui.player; p.phase = "hold"; p.hold = {from:Date.now()+5000, end:Date.now()+5000+p.draft.reps*1000, go:false}; renderPlayer(); tick(); },
  "p-holdstop"(){ const p = ui.player, el = Math.round((Date.now()-p.hold.from)/5000)*5; if(el < 5){ p.phase = "ex"; renderPlayer(); } else markSet(Math.min(el, p.draft.reps)); },
  "p-add"(){ ui.player.rest.end += 15000; ui.player.rest.total += 15; tick(); },
  "p-skip"(){ ui.player.phase = "ex"; renderPlayer(); },
  "p-undo"(){ undoSet(); },
  "p-sugg"(b){ applySugg(b.dataset.move, Number(b.dataset.v)); },
  "task-new"(){ openTaskSheet(null); },
  "task-tpl"(b){ const t = TPL[Number(b.dataset.i)]; openTaskSheet(Object.assign({id:"", days:[1,2,3,4,5,6,0]}, t)); },
  "task-edit"(b){ const t = store.tasks.find(x => x.id === b.dataset.id); if(t) openTaskSheet(t); },
  "task-toggle"(b){ setTask(b.dataset.id, b.getAttribute("aria-pressed") !== "true"); render(); },
  "task-run"(b){ openRunner(b.dataset.id); },
  "t-kind"(b){ readTaskForm(); ui.sheet.draft.kind = b.dataset.v; renderSheet(); },
  "t-min"(b){ readTaskForm(); const dr = ui.sheet.draft; dr.min = Math.min(60, Math.max(1, dr.min + Number(b.dataset.v))); renderSheet(); },
  "t-day"(b){ readTaskForm(); const dr = ui.sheet.draft, v = Number(b.dataset.v), i = dr.days.indexOf(v); if(i >= 0) dr.days.splice(i,1); else dr.days.push(v); renderSheet(); },
  "t-save"(){
    readTaskForm(); const dr = ui.sheet.draft; dr.name = dr.name.trim();
    if(!dr.name){ toast("Напиши название задания"); const n = $("t-name"); if(n) n.focus(); return; }
    if(!dr.days.length){ toast("Выбери хотя бы один день"); return; }
    if(!dr.time) dr.time = "08:00";
    if(dr.id){ const i = store.tasks.findIndex(x => x.id === dr.id); if(i >= 0) store.tasks[i] = dr; }
    else { dr.id = "t"+Date.now().toString(36); store.tasks.push(dr); }
    save(); closeSheet(); render();
  },
  "t-del"(){ const id = ui.sheet.draft.id; store.tasks = store.tasks.filter(x => x.id !== id); save(); closeSheet(); render(); },
  "r-close"(){ closeRunner(false); },
  "r-done"(){ closeRunner(true); },
  rest(b){ P().rest = Number(b.dataset.v); save(); render(); },
  band(){ P().band = !P().band; save(); render(); },
  sound(){ P().sound = P().sound === false; save(); if(P().sound){ audioOn(); beep(1); } render(); },
  reset(){ ui.reset = true; ui.imp = null; render(); },
  "reset-no"(){ ui.reset = false; render(); },
  "reset-yes"(){ store = blank(); ui.reset = false; ui.pick = null; ui.day = null; ui.view = "today"; save(); applyTheme(); render(); window.scrollTo(0,0); },
  cal(b){ const c = ui.cal; c.m += Number(b.dataset.v); if(c.m < 0){ c.m = 11; c.y--; } if(c.m > 11){ c.m = 0; c.y++; } render(); },
  "cal-day"(b){ ui.cal.sel = b.dataset.k; render(); },
  allaw(){ ui.allAwards = !ui.allAwards; render(); }
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if(b){ if(b.disabled) return; const f = A[b.dataset.act]; if(f) f(b); return; }
  if(e.target.id === "sheet") closeSheet();
});
document.addEventListener("keydown", e => { if(e.key === "Escape" && ui.sheet) closeSheet(); });
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); ui.view = (v === "progress" || v === "options") ? v : "today"; if(!ui.player && !ui.runner) render(); });

(function(){ const v = location.hash.slice(1); if(v === "progress" || v === "options") ui.view = v; })();
applyTheme();
render();

// Offline shell. A new version waits until the user taps «Обновить», so a workout is never interrupted by a reload.
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(reg => {
      const offer = w => { ui.update = w; if(idle()) render(); };
      if(reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", () => { const w = reg.installing; if(!w) return;
        w.addEventListener("statechange", () => { if(w.state === "installed" && navigator.serviceWorker.controller) offer(w); }); });
      document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") reg.update().catch(() => {}); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => { if(ui.updating){ ui.updating = false; location.reload(); } });
  });
}
})();
