const app = Vue.createApp({
    data(){
        return{
            menuVisible :true ,
            showFileUpload:false,
            showSchedule:false,
            defaultFiles:true,
            files: {},
            schedule: null,
            courses: [],
            busyTimes: [],
            serviceCourses: [],
            classrooms: [],
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            times: ["8:30", "9:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30"]
        };
    },
    created(){
        this.loadDefaultFiles();
    },
    methods:{
        getCourse(day,timeSlot,year){
            const timeIndex=this.times.indexOf(timeSlot)
            courseInfo=this.schedule[day][timeIndex].courses[year-1]
            return courseInfo[0]==null?"-":courseInfo[0]+" "+courseInfo[1]+" "+courseInfo[2];
        },
        handleFiles(event){
            courses= [];
            busyTimes= [];
            serviceCourses= [];
            classrooms= [];
            const files=event.target.files;
            Array.from(files).forEach(file => {
                const reader=new FileReader();
                reader.onload = e =>{
                    this.files[file.name]=e.target.result;
                    if(file.name==='Courses.csv'){
                        this.courses=this.parseCourses(e.target.result);
                    }
                    else if (file.name === 'busy.csv') {
                        this.busyTimes = this.parseBusy(e.target.result);
                    } else if (file.name === 'service.csv') {
                        this.serviceCourses = this.parseService(e.target.result);
                    } else if (file.name === 'classroom.csv') {
                        this.classrooms = this.parseClassrooms(e.target.result);
                    }
                };
                reader.readAsText(file);
            })
            this.defaultFiles=false;
        },
        async loadDefaultFiles() {
            const responses = await Promise.all([
                fetch('/src/Courses.csv').then(res => res.text()),
                fetch('/src/busy.csv').then(res => res.text()),
                fetch('/src/service.csv').then(res => res.text()),
                fetch('/src/classroom.csv').then(res => res.text())
            ]);
            // Verileri parse edip ilgili state'lere ata
            this.courses = this.parseCourses(responses[0]);
            this.busyTimes = this.parseBusy(responses[1]);
            this.serviceCourses = this.parseService(responses[2]);
            this.classrooms = this.parseClassrooms(responses[3]);
        },
        /*displaySchedule() {
            var sc=""
            console.log("Schedule:\n         |       Year 1      |       Year 2      |       Year 3      |       Year 4       ");
            this.days.forEach(day => {
                console.log(day);
                this.schedule[day].forEach(slot => {
                    const formatTime = time => `${time.split(':')[0].padStart(2, '0')}:${time.split(':')[1]}`;
                    let line = `${formatTime(slot.time)} | `;
                    slot.courses.forEach(course => {
                        line += `${course[1] ? course[0]+" "+course[1]+" "+course[2] : '                   '}  `;
                    });
                    sc=sc+line+"\n";
                    console.log(line);
                });
            });
            return sc;
        },*/
        createTimeSchedule() {
            const schedule = {};
            this.days.forEach(day => {
                schedule[day] = this.times.map(time => ({ 
                    time: time, 
                    courses: Array(4).fill(Array(3).fill(null))}));//each row keeps different year and each column keeps course code class and instructor info.
            });
            return schedule;
        },
        parseCourses(content){
            const result=[];
            const lines=content.split('\n');
            lines.forEach(line=>{
                if(line.trim()==='')
                return;
                const parts = line.split(',');
                result.push({
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
            return result;
        },
        parseBusy(content){
            const result=[];
            const lines=content.split('\n');
            lines.forEach(line=>{
                if(line.trim()=='')
                    return;
                const parts=line.split(',');
                const timeParts = parts.slice(2).map(time => time.replace(/"/g,'').trim());
                result.push({ name :parts[0].trim(), day:parts[1].trim(), times: timeParts });
            })
            return result;
        },
        parseService(content){
            const result=[];
            const lines=content.split('\n');
            lines.forEach(line=>{
                if(line.trim()=='')
                    return;
                    const parts = line.split(',');
                    const times = parts.slice(2).map(time => time.replace(/"/g,'').trim());
                        result.push({
                            name: parts[0].trim(),
                            day: parts[1].trim(),
                            timeSlots: times.map(time => time.trim())
                        });
            })
            return result;
        },
        parseClassrooms(content){
            const result=[];
            const lines=content.split('\n');
            lines.forEach(line=>{
                if(line.trim()=='')
                    return;
                const parts=line.split(';')
                result.push({
                    name:parts[0].trim(),
                    capacity:Number(parts[1].trim())
                })
            })
            return result;
        },
        generateSchedule() {
            if(this.defaultFiles){
                this.loadDefaultFiles();
            }
            this.menuVisible = false;
            this.schedule=this.createTimeSchedule();
            this.placeCourses(this.schedule,this.courses,this.busyTimes,this.serviceCourses,this.classrooms);
            //this.displaySchedule();
            this.showSchedule=true;
        },
        getSuitableClassroom(studentNum,timeSlots,day){
            apClass=null;
            classCapacity=Number.MAX_VALUE;
            this.classrooms.forEach(classroom => {
                isClassAvailable=true;
                size=classroom.capacity;
                timeSlots.forEach(timeS=>{
                    let scheduleArray = this.schedule[day][this.times.indexOf(timeS)].courses;
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
        },
        placeCourses() {
            this.placeServiceCourses();
            const serviceCodes=this.serviceCourses.map(service=> service.name)
            this.courses=this.courses.filter(course=> !serviceCodes.includes(course.code))//removes service courses from main course program
            this.courses.forEach(course =>{
                    let preference =course.hourPreference
                    if(preference==='3')
                    this.placeBlockCourse(course,3)
                    else if(preference==='2+1'){
                        day=this.placeBlockCourse(course,2)
                        this.placeSingleCourse(course,day)
                    }
            })
        },
        placeServiceCourses(){
            this.serviceCourses.forEach(course=>{
                courseInfo=this.courses.find(temp => temp.code === course.name)
                classroom=this.getSuitableClassroom(courseInfo.students,course.timeSlots,course.day);
                if(classroom!=null){
                    this.courses=this.courses.filter(_course => _course.name !==course.name)
                    course.timeSlots.forEach(timeSlot=>{
                        const timeIndex=this.times.indexOf(timeSlot)
                        this.schedule[course.day][timeIndex].courses[courseInfo.year-1]=[course.name,classroom,courseInfo.instructor.split(' ').splice(-1)];
                    }) 
                    
                }
            })
        },
        placeSingleCourse(course,excludedDay) {
            const lastName = course.instructor.split(' ').splice(-1)
            for(const day of this.days){
                if(day===excludedDay) continue//to place the single course hour to another day
                for (let i = 0 ; i < this.times.length; ++i){
                    const currentTimes = [this.times[i]];
                    const busyTime = this.getBusyTime(course.instructor, day);
                    if(this.isInstructorSuitable(currentTimes,busyTime)){
                        const classroom = this.getSuitableClassroom(course.students,currentTimes,day);
                        if(classroom!=null && this.isTimeSlotsAvaiable(day,currentTimes,course.year)){
                            this.schedule[day][i].courses[course.year - 1] = [course.code, classroom, lastName];
                            return day;
                        }
                    }
                }
            }
            console.log('No success')//document.getElementId alertBox "there is no combination to create a proper schedule"
        },
        placeBlockCourse(course,block) {
            const lastName = course.instructor.split(' ').splice(-1);
            for (const day of this.days) {
                for (let i = 0; i <= this.times.length - block; i++) { // Ensure there is room for a "3or 2"  hour block and find the available time block according to instructors' busy times ans classrooms
                    const currentTimes = block==3?[this.times[i], this.times[i+1], this.times[i+2]]:[this.times[i], this.times[i+1]];//determines the block "3 or 2"
                    const busyTime = this.getBusyTime(course.instructor, day);
                    if(this.isInstructorSuitable(currentTimes,busyTime)){//detects intersections between times and busyTimes
                        const classroom = this.getSuitableClassroom(course.students,currentTimes,day);
                        if(classroom!=null && this.isTimeSlotsAvaiable(day,currentTimes,course.year)){
                            for (let timeIndex = i; timeIndex < i + block; timeIndex++) {//places the block of courses
                                this.schedule[day][timeIndex].courses[course.year - 1] = [course.code, classroom, lastName];
                            }
                            return day;
                        }
                    }
                    
                }
            }
            console.log('No success')//document.getElementId alertBox "there is no combination to create a proper schedule"
        },
        isTimeSlotsAvaiable(day,timeSlots,year){
            isAvailable=true;
            timeSlots.forEach(time=>{
                course=this.schedule[day][this.times.indexOf(time)].courses[year-1];
                if(course[0]!=null)//if any time slot is already used by another course 
                isAvailable=false;
            })
            
            return isAvailable
        },
        getBusyTime(instrutor,day){
            busyTime=[]
            this.busyTimes.forEach( time =>{
                if(time.name === instrutor && time.day === day){
                    time.times.forEach(hour=>{
                        busyTime.push(hour)//stores evry busy hours for a specific day and instructor
                    })
                }
            })
            return busyTime.length > 0 ? busyTime : null;
        },
        isInstructorSuitable(times,busyTime){
            if(busyTime===null)//if instructor doesnt have any busy time
            return true;
            for(var i=0;i<times.length;++i){
                if(busyTime.indexOf(times[i])>=0)
                    return false//return false if any element of time appears in the busyTime list
            }
            return true
        }
    }
}).mount('#app');