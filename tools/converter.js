const DAY_TIME = {
    '월': 0,
    '화': 100,
    '수': 200,
    '목': 300,
    '금': 400,
    '토': 500
  }
  const AB_TIME = {
    'A': 0,
    'B': 1
  }
  function splitLectureTM (str) {
    if (!str) {
      return []
    }
    let output = []
    let unit = str.split(',')
    for (let j = 0; j < unit.length; j++) {
      if (unit[j].length === 8) {
        let startStr = unit[j].substr(1, 3)
        let endStr = unit[j].substr(5, 3)
        let startTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(startStr.substr(0, 2)) - 1) + AB_TIME[startStr.charAt(2)]
        let endTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(endStr.substr(0, 2)) - 1) + AB_TIME[endStr.charAt(2)]
  
        for (let k = startTime; k <= endTime; k++) {
          output.push(k)
        }
      } else if (unit[j].length === 4) {
        let startStr = unit[j].substr(1, 3)
        let startTime = DAY_TIME[unit[j].charAt(0)] + 2 * (parseInt(startStr.substr(0, 2)) - 1) + AB_TIME[startStr.charAt(2)]
        output.push(startTime)
      } else {
        // console.log(subject);
      }
    }
    return output
  }
  // ---------------------------------------------
  const fs = require('fs')
  
  let data = JSON.parse(fs.readFileSync('latest.json', 'utf8'))
  let update = JSON.parse(fs.readFileSync('update.json', 'utf8'))
  data.forEach(l => (l.CODE = l.CORS_CD + '-' + l.CLS_NO))
  
  let department = [...new Set(data.map(l => l.DEPT_NM))]
  
  department = department.map(d => ({
    code: d,
    name: d,
    lect_code_list: data.filter(l => l.DEPT_NM === d).map(l => l.CODE)
  }))
  
  let additional = [{
    code: '전체',
    name: '전체',
    lect_code_list: data.map(l => l.CODE)
  }
  ]
  
  let list = {}
  data.forEach(l => {
    let tm = splitLectureTM(l.LECT_TM)
    let timeString = ''
    let lastDay
    // let lastTime
    for (let t of tm) {
      let currentDay = Math.floor(t / 100) + 1
      if (currentDay !== lastDay) {
        timeString += 'D' + currentDay
      }
      let currentTime = Math.floor(t % 100) + 1
      timeString += 'T' + currentTime
  
      lastDay = currentDay
      // lastTime = currentTime
    }
  
    list[l.CODE] = [l.CODE, l.CORS_NM, l.PROF_NM, l.SCH_YR, l.CREDIT, l.CORS_DIV_NM, l.LECT_DIV_NM, l.DEPT_NM, l.REQ_DEPT_NM, l.LECT_TM, l.LECT_RM ? [...new Set(l.LECT_RM.split(','))].join(',') : '', l.LECT_HR, l.CLS_CNT, timeString].map(e => e || '')
  })
  let lecture = {
    list
  }
  
  let result = {
    department,
    additional,
    lecture,
    update
  }
  fs.writeFileSync('exported.json', JSON.stringify(result), 'utf8')
  