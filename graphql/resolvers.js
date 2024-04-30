const kutimeData = require('../exported.json');

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
      }
    }
  };
export default resolvers;