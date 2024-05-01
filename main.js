

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
    hourPreference:parts[8].trim()
  })
})
return results
}
function getSuitableClassroom(studentNum,classrooms,schedule,timeSlots,day){
    apClass=null;
    classCapacity=Number.MAX_VALUE;
    
    classrooms.forEach(classroom => {
        isClassAvailable=true;
        size=classroom.capacity;
        timeSlots.forEach(timeS=>{
            let scheduleArray = schedule[day][times.indexOf(timeS)].courses;
            for (let i = 0; i < scheduleArray.length&&isClassAvailable; i++) {
                let temp = scheduleArray[i];
                if (classroom.name === temp[1]) {//makes false if classroom already exists a course
                    isClassAvailable = false;
                }
            }
        })
        if(isClassAvailable&&studentNum<=size&&classCapacity>size){//changes the classroom with appropriate nad smaller one to save useless seats
            apClass=classroom.name
            classCapacity=classroom.capacity
        }
    })
    if(!apClass){//if apClass is null
        //throw new Error("there is no suitable classroom")//there is no suitable classroom for courses
    }
    return apClass;
}
function placeServiceCourses(schedule,serviceCourses,classrooms){
    serviceCourses.forEach(course=>{
        classroom=getSuitableClassroom(course.students,classrooms,schedule,course.timeSlots,course.day);
        if(classroom){
            courses=courses.filter(_course => _course.name !==course.name)
            course.timeSlots.forEach(timeSlot=>{
                const timeIndex=times.indexOf(timeSlot)
                schedule[course.day][timeIndex].courses[course.year-1]=[course.name,classroom,course.instructor];
            }) 
            
        }
    })
}

function placeCourses(schedule, courses, busyTimes, serviceCourses, classrooms) {
    placeServiceCourses(schedule, serviceCourses, classrooms);
    const serviceCodes=serviceCourses.map(service=> service.name)
    courses=courses.filter(course=> !serviceCodes.includes(course.code))//removes service courses from main course program
    courses.forEach(course =>{
            let preference =course.hourPreference
            if(preference==='3')
                placeBlockCourse(course,busyTimes,schedule,classrooms,3)
            else if(preference==='2+1'){
                day=placeBlockCourse(course,busyTimes,schedule,classrooms,2)
                placeSingleCourse(course,busyTimes,schedule,classrooms,day)
            }
    })
}

function placeSingleCourse(course, busyTimes, schedule, classrooms,excludedDay) {
    const lastName = course.instructor.split(' ').splice(-1)
    for(const day of days){
        if(day===excludedDay) continue//to place the single course hour to another day
        for (let i = 0 ; i < times.length; ++i){
            const currentTimes = [times[i]];
            const busyTime = getBusyTime(busyTimes, course.instructor, day);
            if(isInstructorSuitable(currentTimes,busyTime)){
                const classroom = getSuitableClassroom(course.students,classrooms,schedule,currentTimes,day);
                if(classroom!=null && isTimeSlotsAvaiable(schedule,day,currentTimes,course.year,course.code)){
                    schedule[day][i].courses[course.year - 1] = [course.code, classroom, lastName];
                    return day;
                }
            }
        }
    }
    console.log('No success')//document.getElementId alertBox "there is no combination to create a proper schedule"
}

function placeBlockCourse(course, busyTimes, schedule, classrooms,block) {
    const lastName = course.instructor.split(' ').splice(-1);
    for (const day of days) {
        for (let i = 0; i <= times.length - block; i++) { // Ensure there is room for a "3or 2"  hour block and find the available time block according to instructors' busy times ans classrooms
            const currentTimes = block==3?[times[i], times[i+1], times[i+2]]:[times[i], times[i+1]];//determines the block "3 or 2"

            const busyTime = getBusyTime(busyTimes, course.instructor, day);

            if(isInstructorSuitable(currentTimes,busyTime)){//detects intersections between times and busyTimes
                const classroom = getSuitableClassroom(course.students,classrooms,schedule,currentTimes,day);
                if(classroom!=null && isTimeSlotsAvaiable(schedule,day,currentTimes,course.year)){
                    for (let timeIndex = i; timeIndex < i + block; timeIndex++) {//places the block of courses
                        schedule[day][timeIndex].courses[course.year - 1] = [course.code, classroom, lastName];
                    }
                    return day;
                }
            }
            
        }
    }
    console.log('No success')//document.getElementId alertBox "there is no combination to create a proper schedule"
}
function isTimeSlotsAvaiable(schedule,day,timeSlots,year){
    isAvailable=true;
    timeSlots.forEach(time=>{
        course=schedule[day][times.indexOf(time)].courses[year-1];
        if(course[0]!=null)//if any time slot is already used by another course 
        isAvailable=false;
    })
    
    return isAvailable
}
function getBusyTime(busyTimes,instrutor,day){
    busyTime=[]
    busyTimes.forEach( time =>{
        if(time.name === instrutor && time.day === day){
            time.times.forEach(hour=>{
                busyTime.push(hour)//stores evry busy hours for a specific day and instructor
            })
        }
    })
    return busyTime.length > 0 ? busyTime : null;
}
function isInstructorSuitable(times,busyTime){
    if(busyTime===null)//if instructor doesnt have any busy time
    return true;
    for(var i=0;i<times.length;++i){
        if(busyTime.indexOf(times[i])>=0)
            return false//return false if any element of time appears in the busyTime list
    }
    return true
}
function createTimeSchedule() {
    const schedule = {};
    days.forEach(day => {
        schedule[day] = times.map(time => ({ 
            time: time, 
            courses: Array(4).fill(Array(3).fill(null))}));//each row keeps different year and each column keeps course code class and instructor info.
    });
    return schedule;
}
//-----------------------------------------------------
function displaySchedule(schedule) {
    console.log("Schedule:\n         |       Year 1      |       Year 2      |       Year 3      |       Year 4       ");
    days.forEach(day => {
        console.log(day);
        schedule[day].forEach(slot => {
            const formatTime = time => `${time.split(':')[0].padStart(2, '0')}:${time.split(':')[1]}`;
            let line = `${formatTime(slot.time)} | `;
            slot.courses.forEach(course => {
                line += `${course[1] ? course[0]+" "+course[1]+" "+course[2] : '                   '}  `;
            });
            console.log(line);
        });
    });
}
//-----------------------------------------------------

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
    console.log(error)
    //document.getElementId alertBox
}
let currentTimeMillis = Date.now();
console.log(currentTimeMillis-now);
}

main();
