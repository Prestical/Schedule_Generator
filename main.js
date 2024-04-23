const fs = require('fs');
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const times = ["8:30", "9:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30"];

function readClassrooms(filePath){
const classroom=[];
const classFile=fs.readFileSync(filePath,'utf-8').split('\n').forEach(row=>{
    if(row.trim()=='')
           return;
        const parts=row.split(';')
        classroom.push({name:parts[0].trim(),capacity:Number(parts[1].trim())})
});
return classroom
}
function readBusy(filePath){
    const result=[];
    const csvContent=fs.readFileSync(filePath,'utf-8')
    const rows=csvContent.split('\n');
    rows.forEach(row=>{
        if(row.trim()=='')
           return;
        const parts=row.split(',');
        const timeParts = parts.slice(2).map(time => time.replace(/"/g,'').trim());

        result.push({ name :parts[0].trim(), day:parts[1].trim(), times: timeParts });
    })
    return result
}
function readService(filePath, courses) {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const rows = csvContent.split('\n');
    const result = [];
    rows.forEach(row => {
        if (row.trim() === '') return;
        const parts = row.split(',');
        const times = parts.slice(2).map(time => time.replace(/"/g,'').trim());
        const courseDetails = courses.find(c => c.code === parts[0].trim());
        if (courseDetails) {
            result.push({
                name: parts[0].trim(),
                day: parts[1].trim(),
                timeSlots: times.map(time => time.trim()),
                year: courseDetails.year,
                students: courseDetails.students,
                instructor:courseDetails.instructor.split(' ').slice(-1)
            });
        }
    });
    return result;
}
function readCourseFile(filePath){
    const csvContent=fs.readFileSync(filePath,'utf-8')
    const rows=csvContent.split('\n');
    const results = [];

rows.forEach(row => {
    if(row.trim()=='')
           return;
  const parts = row.split(',');
  results.push({
    code:parts[0].trim(),
    name:parts[1].trim(),
    year:parts[2].trim(),
    credit:parts[3].trim(),
    type:parts[4].trim(),
    department:parts[5].trim(),
    students:Number(parts[6].trim()),
    instructor:parts[7].trim(),
    hours:parts[8].trim()
  })
})
return results
}
function getSuitableClassroom(studentNum,classrooms,schedule,timeSlots,day){
    apClass=null;
    classCapacity=Number.MAX_VALUE;
    classrooms.forEach(classroom => {
        isClassAvailable=true;
        timeSlots.forEach(timeS=>{
            let scheduleArray = schedule[day][times.indexOf(timeS)].courses;
            for (let i = 0; i < scheduleArray.length&&isClassAvailable; i++) {
                let a = scheduleArray[i];
                if (classroom.name === a[1]) {
                    isClassAvailable = false;
                    console.log("hata")
                }
            }
        }) 
        if(isClassAvailable&&studentNum<=classroom.capacity&&classCapacity>classroom.capacity){
            apClass=classroom.name
            classCapacity=classroom.capacity
        }
    })
    if(!apClass){
        throw new Error("there is no suitable classroom")//there is no suitable classroom for courses
    }
    return {apClass}
}
function placeServiceCourses(schedule,serviceCourses,classrooms){
    serviceCourses.forEach(course=>{
        classroom=getSuitableClassroom(course.students,classrooms,schedule,course.timeSlots,course.day);
        if(classroom.apClass){
            courses=courses.filter(_course => _course.name !==course.name)
            course.timeSlots.forEach(timeSlot=>{
                const timeIndex=times.indexOf(timeSlot)
                timeSchedule=schedule[course.day][timeIndex].courses[course.year-1]=[course.name,classroom.apClass,course.instructor];
            }) 
            
        }
    })
}

function placeCourses(schedule, courses, busyTime, serviceCourses, classrooms) {
    placeServiceCourses(schedule, serviceCourses, classrooms); 
}

function displaySchedule(schedule) {
    console.log("Schedule:\n            |     Year 1     |     Year 2     |     Year 3     |     Year 4     ");
    days.forEach(day => {
        console.log(day);
        schedule[day].forEach(slot => {
            const formatTime = time => `${time.split(':')[0].padStart(2, '0')}:${time.split(':')[1]}`;
            let line = `${formatTime(slot.time)} | `;
            slot.courses.forEach(course => {
                line += `${course[1] ? course[0]+" "+course[1]+" "+course[2] : '                      '}  `;
            });
            console.log(line);
        });
    });
}
function createTimeSchedule() {
    const schedule = {};
    days.forEach(day => {
        schedule[day] = times.map(time => ({ 
            time: time, 
            courses: Array(4).fill(Array(3).fill(null))}));
    });
    return schedule;
}
function main(){
let now=Date.now()
const busy = readBusy('busy.csv');
const classrooms= readClassrooms('classroom.csv');
courses = readCourseFile('Courses.csv');
const service = readService('service.csv',courses);
try{
let schedule=createTimeSchedule();
placeCourses(schedule,courses,busy,service,classrooms)
displaySchedule(schedule);
}
catch(error){
    console.log(error.message)
    //document.getElementId alertBox
}
let currentTimeMillis = Date.now();
console.log(currentTimeMillis-now);
}
main();