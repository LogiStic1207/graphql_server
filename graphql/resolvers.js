const kutimeData = require('../exported2.json');
//const qaDict = require('../qaDictionary.json');
//const test = require('../test.json');

const majorCategories = kutimeData.department.map((category) => ({
  id: category.code,
  name: category.name,
  courses: category.lect_code_list,
  isCollege: true
}));

const otherCategories = kutimeData.additional.map((category) => ({
  id: category.code,
  name: category.name,
  courses: category.lect_code_list,
  isCollege: false
}));

const mergedCategories = [...majorCategories, ...otherCategories];

/*
const qaIntents = test.intent.map((intent) => ({
  ner: intent.ner,
  answer: intent.ner[0],
  image: intent.ner[1]
}));
*/
const resolvers = {
    Query: {
      categories: () => {
        return mergedCategories;
      },
      courses: (parent, { categoryId, courseIds = [] }) => {
        const category = mergedCategories.find(category => categoryId === category.id);
        let filteredCourseIds = category ? category.courses : [];
  
        if (courseIds.length > 0) {
          filteredCourseIds = filteredCourseIds.filter(id => courseIds.includes(id));
        }
  
        return filteredCourseIds.map(courseId => {
          const course = kutimeData.lecture.list[courseId];
          console.log(courseIds);
          return {
            id: course[0],
            name: course[1],
            professor: course[2],
            grade: course[3],
            credit: course[4],
            type1: course[5],
            type2: course[6],
            targetDepartment: course[7],
            target: course[8],
            time: course[9],
            place: course[10],
            creditDetail: course[11],
            limit: course[12],
            timeData: course[13]
          };
        });
      },
      /*
      answer: (parent, { intent, ner }) => {
        //const intent = qaIntents.find(intent => intentName === intent.name);
        //let filteredNers = intent ? intent.ners : [];

        // if(ner.length > 0) {
        //   filteredNers = filteredNers.filter(ner => ners.includes(ner));
        // }
        let filteredNers = qaDict[intent]
        return filteredNers.map(ner => {
          const single_ner = filteredNers[ner];
          return {
            answer: single_ner[1],

          };
        });
      }*/
    }
  };
export default resolvers;