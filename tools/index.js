process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
// WARNING: https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs

const fs = require('fs');
const convert = require('xml-js');
const nodeFetch = require('node-fetch');
const tough = require('tough-cookie');
const cookie = new tough.CookieJar();
const fetch = require('fetch-cookie')(nodeFetch, cookie);

async function login(user_id, user_pwd) {
  // initFetch();
  user_id = encodeURIComponent(user_id);
  user_pwd = encodeURIComponent(user_pwd);

  let loginPage = await fetch('https://kut90.koreatech.ac.kr/login/LoginPage.do').then(r => r.text());
  let csrf = /(?<="_csrf" value=").+?(?=")/.exec(loginPage)[0];
  await fetch("https://kut90.koreatech.ac.kr/login/Login.do", {
    "headers": {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    "body": `id=${user_id}&pwd=${user_pwd}&userdiv=emp&_csrf=${csrf}`,
    "method": "POST",
  });
}

// view = 12, 14, 15
// year = 20xx
// term = 1학기:10, 여름학기:11, 2학기:20, 겨울학기:21
async function getLectureXML(view, year, term) {
  return await fetch('https://kut90.koreatech.ac.kr/nexacroController.do', {
    'body':
      `
<?xml version="1.0" encoding="UTF-8"?>
<Root xmlns="http://www.nexacroplatform.com/platform/dataset">
	<Parameters>
		<Parameter id="method">getList_sp</Parameter>
		<Parameter id="sqlid">NK_SOT_MST.NP_SELECT_${view}</Parameter>
	</Parameters>
	<Dataset id="input1">
		<ColumnInfo>
			<Column id="YR" type="string" size="4000" />
			<Column id="TERM_DIV" type="string" size="4000" />
		</ColumnInfo>
		<Rows>
			<Row>
				<Col id="YR">${year}</Col>
				<Col id="TERM_DIV">${term}</Col>
			</Row>
		</Rows>
	</Dataset>
</Root>
`.trim(),
    'method': 'POST'
  }).then(r => r.text());
}

function x2j(x) {
  let target = x.Root.Dataset.Rows.Row;
  if (!target) return {};
  if (!target.map) {
    target = [target];
  }
  return target.map(r => r.Col.reduce((a, c) => (a[c._attributes.id] = c._text, a), {}));
}

const views = [12, 14, 15];
const options = {
  compact: true,
  spaces: 4
};

async function getLectureData(year, term) {
  let lectureData = await Promise.all(views.map(v => getLectureXML(v, year, term)));
  lectureData = lectureData.map(v => x2j(convert.xml2js(v, options))).flat().filter(r => Object.keys(r).length !== 0);
  lectureData = lectureData.reduce((a, l) => {
    let k = l['CORS_CD'] + l['CLS_NO'];
    a[k] = {
      ...a[k],
      ...l
    };
    return a;
  }, {});
  return Object.values(lectureData);
}

const DAY_TIME = {
  "월": 0,
  "화": 100,
  "수": 200,
  "목": 300,
  "금": 400,
  "토": 500
};
const AB_TIME = {
  "A": 0,
  "B": 1
};

function splitLectureTM(str) {
  if (!str) {
    return [];
  }
  let output = [];
  let unit = str.split(',');
  for (let j = 0; j < unit.length; j++) {
    if (unit[j].length == 8) {
      let startStr = unit[j].substr(1, 3);
      let endStr = unit[j].substr(5, 3);
      let startTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(startStr.substr(0, 2)) - 1) + AB_TIME[startStr.charAt(2)];
      let endTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(endStr.substr(0, 2)) - 1) + AB_TIME[endStr.charAt(2)];

      for (let k = startTime; k <= endTime; k++) {
        output.push(k);
      }
    } else if (unit[j].length == 4) {
      let startStr = unit[j].substr(1, 3);
      let startTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(startStr.substr(0, 2)) - 1) + AB_TIME[startStr.charAt(2)];
      output.push(startTime);
    } else {
      // console.log(subject);
    }
  }
  return output;
}

const JSD_FORMAT_KEYS = ['CORS_CD', 'CORS_NM', 'CLS_NO', 'REQ_DEPT_NM', 'LECT_RM', 'CREDIT', 'LECT_DES', 'DEPT_NM', 'PROF_NM', 'CLS_CNT', 'LECT_TMA'];
const TERMS = {10: '1학기', 11: '여름학기', 20: '2학기', 21: '겨울학기'};
!async function () {
  await login(process.env.KOREATECH_ID || process.argv[2], process.env.KOREATECH_PW || process.argv[3]);
  let year = new Date().getFullYear();
  let termsKey = Object.keys(TERMS).slice(0, 3);
  // TERMS.slice(3);
  for (let term of termsKey) {
    let termKorean = TERMS[term];
    try {
      let ld = await getLectureData(year, term);
      if(ld.length === 0) {
        break;
      }
      fs.writeFileSync('latest.json', JSON.stringify(ld), 'utf8');
      ld.forEach(e => {
        e.LECT_TMA = splitLectureTM(e.LECT_TM);
        e.LECT_DES = e.LECT_HR ? e.LECT_HR.split('-').pop() : void 0;
      });
      ld = ld.map(e => JSD_FORMAT_KEYS.map(k => e[k]));
      ld = ld.map(e => e.map(v => v ? (typeof v === 'object' ? v : String(v)) : ''));
      let update = {
        time: new Date(),
        year,
        term: termKorean,
        size: Buffer.byteLength(JSON.stringify(ld))
      };
      fs.writeFileSync('update.json', JSON.stringify(update), 'utf8');
      console.log(`${year}년 ${termKorean} 갱신 완료!`);
      console.log(update);
    } catch (e) {
      console.error(e);
      break;
    }
  }
}
();
