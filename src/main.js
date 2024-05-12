const app = Vue.createApp({
    
    data(){
        return {
            currentView: 'menu', //starts the page with menu
            formData: {},
            selectedObject: {},
            files: {},
            schedule: null,
            courses: [],
            busyTimes: [],
            serviceCourses: [],
            classrooms: [],
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            times: ["8:30", "9:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30"],
            modalData: null,
            modalType: null,
            sections: [//elements of toolbar 
                { title: 'Courses', dataSet: this.courses ,type: 'Courses'},
                { title: 'Busy Times', dataSet: this.busyTimes ,type: 'busy'},
                { title: 'Service Courses', dataSet: this.serviceCourses ,type: 'service'},
                { title: 'Classrooms', dataSet: this.classrooms ,type:'classroom'}
            ],
            removedCourses: [],
            editOption: "",
        };
    },
    created(){//this part is processed, when app.js is loaded
        this.loadDefaultFiles();
    },
    watch: {
        selectedObject: function(newVal, oldVal) {
            if (newVal) {
                // Seçilen dersin bilgilerini göster
                this.selectedCourse = newVal;
                this.newCourseCode = newVal.code;
            } else {
                this.selectedCourse = null;
                this.newCourseCode = "";
            }
        }
    },
    computed: {
        uniqueInstructors() {
            const instructorSet = new Set();
            this.sections[0].dataSet.forEach(object => {
                instructorSet.add(object.instructor);
            });
            return Array.from(instructorSet);
        }
    },
    methods: {
        assignSections(){
            this.sections= [//elements of toolbar 
                { title: 'Courses', dataSet: this.courses ,type: 'Courses'},
                { title: 'Busy Times', dataSet: this.busyTimes ,type: 'busy'},
                { title: 'Service Courses', dataSet: this.serviceCourses ,type: 'service'},
                { title: 'Classrooms', dataSet: this.classrooms ,type:'classroom'}
            ]
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        dragOver(event) {
            event.preventDefault();
        },
        dragLeave(event) {
            event.preventDefault();
        },
        handleDrop(event) {
            const files = Array.from(event.dataTransfer.files);
            const csvFiles = files.filter(file => file.name.endsWith('.csv'));
            
            if (csvFiles.length > 0) {
                this.handleFiles({ target: { files: csvFiles } });
            } else {
                alert('Please only drop CSV extension files');
            }
        },
        toggleView(view) {
            this.currentView = view;
        },
        handleSubmit() {
            console.log('Form submitted:', this.formData); // Show what submitted from form
            this.add();
        },
        addTime(time){
            this.selectedTimes.push(time);
            console.log(this.selectedTimes);
        },
        add() {// There is an error in Add serviseCourse section
            console.log(this.modalData);
            if(Object.keys(this.formData).length > 0){
                if (this.modalType === 'Courses') {
                    this.courses.push({
                        code: this.formData.code.trim(),
                        name: this.formData.name.trim(),
                        year: this.formData.year.trim(),
                        credit: this.formData.credit.trim(),
                        type: this.formData.type.trim(),
                        department: this.formData.department.trim(),
                        students: Number(this.formData.students.trim()),
                        instructor: this.formData.instructor.trim(),
                        hourPreference: this.formData.hourPreference.trim()
                    });
                } else if (this.modalType === 'busy') {
                    this.busyTimes.push({
                        name: this.formData.name.trim(),
                        day: this.formData.day.trim(),
                        times: this.formData.times.trim().split(',').map(time => time.trim())
                    });
                } else if (this.modalType === 'service') {
                    this.serviceCourses.push({
                        code: String(this.formData.code).trim(),
                        day: this.formData.day.trim(),
                        timeSlots: this.formData.timeSlots.trim().split(',').map(time => time.trim())
                    });
                } else if (this.modalType === 'classroom') {
                    this.classrooms.push({
                        name: this.formData.name.trim(),
                        capacity: Number(this.formData.capacity.trim())
                    });
                }
            }
            this.selectedTimes = [];
            this.formData = {};
            this.assignSections();
        },
        edit() { // Cant save the changes to the specific array (it can show changes immediately in same page)
            switch (this.editOption) {
                case 'code':
                    this.selectedObject.code = this.newValue;
                    break;
                case 'name':
                    this.selectedObject.name = this.newValue;
                    break;
                case 'day':
                    this.selectedObject.day = this.newValue;
                    break;
                case 'times': // Can accept multiple time inputs
                    this.selectedObject.times = String(this.newValue).trim().split(',').map(time => time.trim());
                    break;
                case 'capacity':
                    this.selectedObject.capacity = this.newValue;
                    break;
                case 'timeSlots': // Can accept multiple time inputs
                    this.selectedObject.timeSlots = String(this.newValue).trim().split(',').map(time => time.trim());
                    break;
                case 'year':
                    this.selectedObject.year = this.newValue;
                    break;
                case 'credit':
                    this.selectedObject.credit = this.newValue;
                    break;
                case 'type':
                    this.selectedObject.type = this.newValue;
                    break;
                case 'department':
                    this.selectedObject.department = this.newValue;
                    break;
                case 'students':
                    this.selectedObject.students = this.newValue;
                    break;
                case 'instructor':
                    this.selectedObject.instructor = this.newValue;
                    break;
                case 'hourPreference':
                    this.selectedObject.hourPreference = this.newValue;
                    break;
                default:
                    break;
            }
            console.log(this.selectedObject);
        
            this.newValue = ''; // Reset the input field
            this.editOption = ''; // Reset the edit option
            this.selectedObject = {};
        },
        selectCourse(course) {
            // Seçilen dersi güncel seçilen ders olarak ayarla
            this.selectedCourse = course;
        },
        remove(){ // (it can not show changes immediately in same page) Also when we open different remove sections removedCourses show past deleteions
            if (this.selectedObject){
                if (this.modalType === 'Courses') {
                    this.courses = this.courses.filter(obj => obj.code !== this.selectedObject.code);
                    this.modalData = this.courses;
                } else if (this.modalType === 'busy') {
                    // Solved the deleting duplicated names
                    this.busyTimes = this.busyTimes.filter(obj => !(obj.times === this.selectedObject.times && obj.name === this.selectedObject.name));
                    this.modalData = this.busyTimes;
                } else if (this.modalType === 'service') {
                    this.serviceCourses = this.serviceCourses.filter(obj => obj.code !== this.selectedObject.code);
                    this.modalData = this.serviceCourses;
                } else if (this.modalType === 'classroom') {
                    this.classrooms = this.classrooms.filter(obj => obj.name !== this.selectedObject.name);
                    this.modalData = this.classrooms;
                }
                this.removedCourses.push(this.selectedObject);
                this.selectedObject = {};
                this.assignSections();
            }
           
        },
        getCourse(day,timeSlot,year){
            const timeIndex=this.getTimeIndex(timeSlot)
            courseInfo=this.schedule[day][timeIndex].courses[year-1]
            return courseInfo[0]==null?"&nbsp;":courseInfo[0]+" "+courseInfo[1];
        },
        handleFiles(event){
            const files=event.target.files;
            Array.from(files).forEach(file => {
                const reader=new FileReader();
                reader.onload = e =>{
                    this.files[file.name]=e.target.result;
                    try {
                        if(file.name==='Courses.csv'){
                            this.courses=this.parseCourses(e.target.result);
                        } else if (file.name === 'busy.csv') {
                            this.busyTimes = this.parseBusy(e.target.result);
                        } else if (file.name === 'service.csv') {
                            this.serviceCourses = this.parseService(e.target.result);
                        } else if (file.name === 'classroom.csv') {
                            this.classrooms = this.parseClassrooms(e.target.result);
                        }
                    } catch (parseError) {
                        alert(`Error parsing ${file.name}: ${parseError.message}`);
                    }
                };
                reader.readAsText(file);
            })
            this.assignSections();
        },
        async loadDefaultFiles() {
            try {
                const responses = await Promise.all([
                    fetch('data/Courses.csv').then(res => res.text()),
                    fetch('data/busy.csv').then(res => res.text()),
                    fetch('data/service.csv').then(res => res.text()),
                    fetch('data/classroom.csv').then(res => res.text())
                ]);
                this.courses = this.parseCourses(responses[0]);
                this.busyTimes = this.parseBusy(responses[1]);
                this.serviceCourses = this.parseService(responses[2]);
                this.classrooms = this.parseClassrooms(responses[3]);
                this.assignSections();
            } catch (error) {
                console.error('Failed to load default files:', error);
                alert('Failed to load one or more default files. Please check the console for more details.');
            }
        },
        saveChanges(){
            console.log(this.modalData)
            this.removedCourses = [];
            this.updateFile(this.modalType+'.csv')
        },
        async updateFile(fileName) {
            console.log('Updating file ' + fileName);
            const content=this.modalData;
            console.log(content)
            switch (fileName) {
                case "course":
            }
            try {
                const response = await fetch('http://localhost:3030/update-data', {//you can change the port (3030), if required, dont forget to change the port in server.js as well
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fileName, content })
                });
        
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                
                const responseData = await response.json();
                console.log(responseData);  // Log the response data from the server
            } catch (error) {
                console.error('Error:', error);
            }
        },
        createTimeSchedule() {
            const schedule = {};
            this.days.forEach(day => {
                schedule[day] = this.times.map(time => ({ 
                    time: time, 
                    courses: Array(4).fill(Array(2).fill(null))}));//each row keeps different year and each column keeps course code and class
            });
            this.schedule = schedule;
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
                    hourPreference:parts[8]
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
                            code: parts[0].trim(),
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
            this.createTimeSchedule();
            if(this.placeCourses()){
                this.toggleView("schedule")
            }
            
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
            return apClass;
        },
        getTimeIndex(hour){
            return this.times.indexOf(hour);
        },
        placeCourses() {
            this.placeServiceCourses();
            const serviceCodes=this.serviceCourses.map(service=> service.code)
            for(const course of this.courses){
                if(!serviceCodes.includes(course.code)){
                    if(!this.placeCourse(course)){
                        return false;
                    }
                }
            }
            return true;
        },
        placeServiceCourses(){
            this.serviceCourses.forEach(course=>{
                courseInfo=this.courses.find(temp => temp.code === course.code)
                classroom=this.getSuitableClassroom(courseInfo.students,course.timeSlots,course.day);
                if(classroom!=null && this.isTimeSlotsAvaiable(course.day,course.timeSlots,courseInfo.year)){
                    course.timeSlots.forEach(timeSlot=>{
                        const timeIndex=this.times.indexOf(timeSlot)
                        this.schedule[course.day][timeIndex].courses[courseInfo.year-1]=[course.code,classroom];
                    }) 
                    
                }
            })
        },
        placeCourse(course,excludedDay="",block=null){
            if(block==null){
                block=course.hourPreference.trim().split('+').map(num => Number(num));
            }
            for(const day of this.days){
                if(excludedDay===day) continue;
                for( var i=0; i<=this.times.length-block[0]; i++){
                    var currentTimes=this.times.slice(i,i+block[0]);
                    const busyTime=this.getBusyTime(course.instructor,day);
                    if(this.isInstructorSuitable(currentTimes,busyTime)){
                        const classroom= this.getSuitableClassroom(course.students,currentTimes,day);
                        if(classroom!=null && this.isTimeSlotsAvaiable(day,currentTimes,course.year)){
                            currentTimes.forEach(hour=>{
                                const timeIndex=this.getTimeIndex(hour);
                                this.schedule[day][timeIndex].courses[course.year-1]=[course.code,classroom]
                            })
                            if(block.length>1){
                                this.placeCourse(course,day,[block[1]])
                            }
                            return true;
                        }
                    }
                }
            }
            this.showSchedule=false;
            console.log(course.code," ",block)
            alert("no succes");
            return false;
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
        },
        /*displaySchedule() {//to display the schedule on console
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
        }*/
    }
}).mount('#app');
