const app = Vue.createApp({

    data() {
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
            dayTimeSlots: ["08:30 - 09:20", "09:30 - 10:20", "10:30 - 11:20", "11:30 - 12:20", "12:30 - 13:20", "13:30 - 14:20", "14:30 - 15:20", "15:30 - 16:20"],
            modalData: null,
            modalType: null,
            sections: [//elements of toolbar 
                { title: 'Courses', dataSet: this.courses, type: 'Courses' },
                { title: 'Busy Times', dataSet: this.busyTimes, type: 'busy' },
                { title: 'Service Courses', dataSet: this.serviceCourses, type: 'service' },
                { title: 'Classrooms', dataSet: this.classrooms, type: 'classroom' }
            ],
            removedCourses: [],
            editOption: "",
            timeRegex: /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/,
            newValue: null
        };
    },
    created() {//this part is processed, when app.js is loaded
        this.loadDefaultFiles();
    },
    watch: {
        selectedObject: function (newVal, oldVal) {
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
        assignSections() {
            this.sections = [//elements of toolbar 
                { title: 'Courses', dataSet: this.courses, type: 'Courses' },
                { title: 'Busy Times', dataSet: this.busyTimes, type: 'busy' },
                { title: 'Service Courses', dataSet: this.serviceCourses, type: 'service' },
                { title: 'Classrooms', dataSet: this.classrooms, type: 'classroom' }
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
            if (this.modalType === "Courses") {
                const year = Number(this.formData.year);
                const hourPreference = this.formData.hourPreference;
                const studentNum = Number(this.formData.students);
                const credit = Number(this.formData.credit);
                if (this.modalType === "Courses" && (isNaN(year) || year < 1 || year > 4)) {
                    alert('Year must be number between 1 and 4.');
                    return false;
                }
                if (this.modalType === "Courses" && (!/^(\d+\+\d+|\d+)$/.test(hourPreference))) {
                    alert('Hour preference must be a single number or two numbers separated by a "+".');
                    return false;
                }
                if (this.modalType === "Courses" && (isNaN(studentNum) || studentNum <= 0)) {
                    alert('Invalid case: student must be a number and bigger than 0');
                    return false;
                }
                if (this.modalType === "Courses" && (isNaN(credit) || credit <= 0)) {
                    alert('Invalid case: credit must be a number and bigger than 0');
                    return false;
                }
            }
            else if (this.modalType === "busy" && !(this.formData.times.split(",").every(t => this.times.includes(t))||!(this.days.includes(this.formData.day))) ) {
                alert('Invalid case: time must be proper format (8:30 or 12:30) and between 8:30 and 15:30');
                return false;
            }
            else if (this.modalType === "service" && !(this.formData.timeSlots.split(",").every(t => this.times.includes(t))||!(this.days.includes(this.formData.day)))) {
                alert('Invalid case: time must be proper format ()');
                return false;
            }
            else if (this.modalType === "classroom" && (isNaN(Number(this.formData.capacity.trim())) || Number(this.formData.capacity.trim()) <= 0)) {
                alert('Invalid case: capacity must be a number and bigger than 0');
                return false;
            }
            console.log(this.formData.day)

            console.log('Form submitted:', this.formData);
            this.add();
        },
        addTime(time) {
            this.selectedTimes.push(time);
            console.log(this.selectedTimes);
        },
        add() {// There is an error in Add serviseCourse section
            console.log(this.modalData);
            if (Object.keys(this.formData).length > 0) {
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
            if (this.modalType === "Courses") {
                
                const year = Number(this.newValue);
                const hourPreference = this.newValue;
                const studentNum = Number(this.newValue);
                const credit = Number(this.newValue);
                if (this.editOption === "year" && (isNaN(year) || year < 1 || year > 4)) {
                    alert('Year must be number between 1 and 4.');
                    this.resetElements();
                    return false;
                }
                if (this.editOption === "hourPreference" && (!/^(\d+\+\d+|\d+)$/.test(hourPreference))) {
                    alert('Hour preference must be a single number or two numbers separated by a "+".');
                    this.resetElements();
                    return false;
                }
                if (this.editOption === "students" && (isNaN(studentNum) || studentNum <= 0)) {
                    alert('Invalid case: student must be a number and bigger than 0');
                    this.resetElements();
                    return false;
                }
                if (this.editOption === "credit" && (isNaN(credit) || credit <= 0)) {
                    alert('Invalid case: credit must be a number and bigger than 0');
                    this.resetElements();
                    return false;
                }
            }
            else if(this.editOption === "day"&& !(this.days.includes(this.newValue))){
                alert('Invalid case: day must be between Monday and Friday and first letter must be upper case!');
                this.resetElements();
                return false;
            }
            else if (this.editOption === 'times' && (this.modalType === "busy" && !(this.newValue.split(",").every(t => this.times.includes(t))))) {
                alert('Invalid case: time must be proper format (8:30 or 12:30) and between 8:30 and 15:30');
                this.resetElements();
                return false;
            }
            else if (this.editOption === 'timeSlots' && (this.modalType === "service" && !(this.newValue.split(",").every(t => this.times.includes(t))))) {
                alert('Invalid case: time must be proper format (8:30 or 12:30) and between 8:30 and 15:30');
                this.resetElements();
                return false;
            }
            else if (this.editOption === 'capacity' && (this.modalType === "classroom" && (isNaN(Number(this.newValue.trim())) || Number(this.newValue.trim()) <= 0))) {
                alert('Invalid case: capacity must be a number and bigger than 0');
                this.resetElements();
                return false;
            }
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
            this.resetElements();
        },
        resetElements() {
            this.newValue = ''; // Reset the input field
            this.editOption = ''; // Reset the edit option
            this.selectedObject = {};
        },
        selectCourse(course) {
            // Seçilen dersi güncel seçilen ders olarak ayarla
            this.selectedCourse = course;
        },
        remove() { // (it can not show changes immediately in same page) Also when we open different remove sections removedCourses show past deleteions
            if (this.selectedObject) {
                if (this.modalType === 'Courses') {
                    this.courses = this.courses.filter(obj => obj.code !== this.selectedObject.code);
                    if(this.selectedObject.department === 'S'){
                        this.serviceCourses = this.serviceCourses.filter(obj => obj.code !== this.selectedObject.code);
                    }
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
        getCourse(day, timeSlot, year) {
            const timeIndex = this.getTimeIndex(timeSlot)
            courseInfo = this.schedule[day][timeIndex].courses[year - 1]
            return courseInfo[0] == null ? "&nbsp;" : courseInfo[0] + " " + courseInfo[1];
        },
        handleFiles(event) {
            const files = event.target.files;
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    this.files[file.name] = e.target.result;
                    try {
                        if (file.name === 'Courses.csv') {
                            this.parseCourses(e.target.result);
                        } else if (file.name === 'busy.csv') {
                            this.parseBusy(e.target.result);
                        } else if (file.name === 'service.csv') {
                            this.parseService(e.target.result);
                        } else if (file.name === 'classroom.csv') {
                            this.parseClassrooms(e.target.result);
                        }
                        else {
                            throw new Error();
                        }
                    } catch (parseError) {
                        alert(`Error parsing ${file.name}: ${parseError.message}`);
                        return;
                    }

                };
                console.log(`${file.name} loaded successfully!`);
                reader.readAsText(file);
            })
            this.assignSections();
            alert('All files loaded successfully');

        },
        async loadDefaultFiles() {
            try {
                const responses = await Promise.all([
                    fetch('data/Courses.csv').then(res => res.text()),
                    fetch('data/busy.csv').then(res => res.text()),
                    fetch('data/service.csv').then(res => res.text()),
                    fetch('data/classroom.csv').then(res => res.text())
                ]);
                this.parseCourses(responses[0]);
                this.parseBusy(responses[1]);
                this.parseService(responses[2]);
                this.parseClassrooms(responses[3]);
                this.assignSections();
                console.log("Default files loaded successfully!");
            } catch (error) {
                console.error('Failed to load default files:', error);
                alert('Failed to load one or more default files. Please check the console for more details.');
            }
        },
        saveChanges() {
            this.removedCourses = [];
            this.updateFile();
        },
        async updateFile() {
            const fileName = (this.modalType + '.csv');
            const content = this.modalData;
            console.log('Updating file ' + fileName);
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
                alert("An error occurred while updating file please check the console for more details")
                console.error('Error:', error);
            }
        },
        createTimeSchedule() {
            const schedule = {};
            this.days.forEach(day => {
                schedule[day] = this.times.map(time => ({
                    time: time,
                    courses: Array(4).fill(Array(2).fill(null))
                }));//each row keeps different year and each column keeps course code and class
            });
            this.schedule = schedule;
        },
        parseCourses(content) {
            const result = [];
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim() === '')
                    return;
                const parts = line.split(',');
                const year =Number(parts[2].trim());
                const students = Number(parts[6].trim());
                const credit=Number(parts[3].trim());
                if( isNaN(year) || !(year >= 1 && year <=5)){
                    alert("An error occurred while reading file, please check the console for more information");
                    throw new Error('Please check course file, there is an error about course year: '+line);
                }
                if(isNaN(students) || !(students>0)){
                    alert("An error occurred while reading file, please check the console for more information");
                    throw new Error('Please check course file, there is an error about course students: '+line);
                }
                if (!/^(\d+\+\d+|\d+)$/.test(parts[8].trim())) {
                    alert("An error occurred while reading file, please check the console for more information");
                    throw new Error('Please check course file, there is an error about course hourPreference: '+line);
                }
                if(isNaN(credit) || !(credit>0)){
                    alert("An error occurred while reading file, please check the console for more information");
                    throw new Error('Please check course file, there is an error about course credit: '+line);
                }
                result.push({
                    code: parts[0].trim(),
                    name: parts[1].trim(),
                    year: year,
                    credit: credit,
                    type: parts[4].trim(),
                    department: parts[5].trim(),
                    students: students,
                    instructor: parts[7].trim(),
                    hourPreference: parts[8]
                })
            })
            this.courses = result;
        },
        parseBusy(content) {
            const result = [];
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim() == '')
                    return;
                const parts = line.split(',');
                const timeParts = parts.slice(2).map(time => time.replace(/"/g, '').trim());
                if (!timeParts.every(time => this.times.includes(time))) throw new Error(`Invalid case; there is a problem about times in: ${line}`);
                if(!this.days.includes(parts[1].trim())) throw new Error(`Invalid case; there is a problem about days in: ${line}`);
                result.push({ name: parts[0].trim(), day: parts[1].trim(), times: timeParts });
            })
            this.busyTimes = result;
        },
        parseService(content) {
            const result = [];
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim() == '')
                    return;
                const parts = line.split(',').map(element => element.trim());
                const times = parts.slice(2).map(time => time.replace(/"/g, '').trim());
                if (!times.every(time => this.timeRegex.test(time))) throw new Error(`Invalid case; there is a problem about times in: ${line}`);
                if(!this.days.includes(parts[1].trim())) throw new Error(`Invalid case; there is a problem about days in: ${line}`);
                result.push({
                    code: parts[0].trim(),
                    day: parts[1].trim(),
                    timeSlots: times.map(time => time.trim())
                });
            })
            this.serviceCourses = result;
        },
        parseClassrooms(content) {
            const result = [];
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim() == '')
                    return;
                const parts = line.split(';')
                const capacity = Number(parts[1].trim());
                if(isNaN(capacity)|| capacity <=0 ){
                    alert("An error occurred while reading file, please check the console for more information");
                    throw new Error('Please check classroom file, there is an error about classroom capacity: '+line);
                }
                result.push({
                    name: parts[0].trim(),
                    capacity: Number(parts[1].trim())
                })
            })
            this.classrooms = result;
        },
        generateSchedule() {
            this.createTimeSchedule();
            if (this.placeCourses()) {
                this.toggleView("schedule")
            }
            //this.displaySchedule();

        },
        getSuitableClassroom(studentNum, timeSlots, day) {
            apClass = null;//keeps appropriate classroom if it is exist
            classCapacity = Number.MAX_VALUE;
            this.classrooms.forEach(classroom => {
                isClassAvailable = true;
                size = classroom.capacity;
                timeSlots.forEach(timeS => {//!checks all time slots of the course sent
                    let scheduleArray = this.schedule[day][this.getTimeIndex(timeS)].courses;
                    for (let i = 0; i < scheduleArray.length && isClassAvailable; i++) {
                        let temp = scheduleArray[i];
                        if (classroom.name === temp[1]) {//makes false if classroom already exists a course
                            isClassAvailable = false;
                        }
                    }
                })
                if (isClassAvailable && studentNum <= size && classCapacity > size) {//changes the classroom with appropriate and smaller one to save useless seats 
                    //!for example if current classroom is B503(160 seats) and next class is c501(60 seats) this block changes the appClass to c501
                    apClass = classroom.name
                    classCapacity = classroom.capacity
                }
            })
            return apClass;
        },
        getTimeIndex(hour) {
            return this.times.indexOf(hour);
        },
        placeCourses() {
            if (this.placeServiceCourses() == false) {//!if this method returns false that means a thre is a propblem about service courses (probably an alert appeared on page)
                return false;//! dont show the schedule if there exits a problem
            }
            const serviceCodes = this.serviceCourses.map(service => service.code)
            for (const course of this.courses) {
                if (!serviceCodes.includes(course.code)) {//!skips service lesson because they already placed on schedule
                    if (!this.placeCourse(course)) {
                        return false;//! dont show the schedule if there exits a problem
                    }
                }
            }
            return true;
        },
        placeServiceCourses() {
            for (const course of this.serviceCourses) {
                courseInfo = this.courses.find(temp => temp.code === course.code);//! gets all info(credit, students etc.) about service course
                classroom = this.getSuitableClassroom(courseInfo.students, course.timeSlots, course.day);
                if (classroom == null) {
                    alert(`There is no suitable classroom for service course: ${course.code}`);
                    return false;
                }
                if (this.isTimeSlotsAvaiable(course.day, course.timeSlots, courseInfo.year)) {
                    course.timeSlots.forEach(timeSlot => {//! places course for all time slots for ex. (ENGR254,Tuesday, timeSlots:"13:30,14:30,15:30" )
                        const timeIndex = this.times.indexOf(timeSlot)
                        this.schedule[course.day][timeIndex].courses[courseInfo.year - 1] = [course.code, classroom];
                    })
                }
                else {
                    alert(`There is already a service course in this time slot ${course.timeSlots} please change time slot of service course`);
                    return false;
                }

            }
            return true;
        },
        placeCourse(course, excludedDay = "", block = null) {
            isClassroomExist = false;
            if (block == null) {//! if block is null that means this course is a block course (3)
                block = course.hourPreference.trim().split('+').map(num => Number(num));//! hourpreference of course is (2+1) 
            }
            for (const day of this.days) {
                if (excludedDay === day) continue;//for (x+y) courses, if x is placed on Monday, excludedDay will be Monday for y  
                for (var i = 0; i <= this.times.length - block[0]; i++) {
                    var currentTimes = this.times.slice(i, i + block[0]);//to take block of hours, if i equal 0 currentTimes will be ["8:30", "9:30", "10:30"]
                    const busyTime = this.getBusyTime(course.instructor, day);
                    if (this.isInstructorSuitable(currentTimes, busyTime)) {
                        const classroom = this.getSuitableClassroom(course.students, currentTimes, day);
                        if (classroom != null) {
                            isClassroomExist == true;//! that means there exist at least one classroom, to error handling
                            if (this.isTimeSlotsAvaiable(day, currentTimes, course.year)) {
                                currentTimes.forEach(hour => {
                                    const timeIndex = this.getTimeIndex(hour);
                                    this.schedule[day][timeIndex].courses[course.year - 1] = [course.code, classroom]
                                })
                                if (block.length > 1) {//place remaining part(if it is exist)
                                    this.placeCourse(course, day, [block[1]])
                                }
                                return true;
                            }
                        }
                    }
                }
            }
            this.showSchedule = false;
            console.log(course.code, " ", block)
            if (isClassroomExist) {
                alert(`There is no suitable time slot for course: ${course.code}`);
            }
            else {
                alert(`There is no suitable classroom for course: ${course.code}`);
            }
            return false;
        },
        isTimeSlotsAvaiable(day, timeSlots, year) {
            isAvailable = true;
            timeSlots.forEach(time => {
                course = this.schedule[day][this.times.indexOf(time)].courses[year - 1];
                if (course[0] != null)//if any time slot is already used by another course 
                    isAvailable = false;
            })

            return isAvailable
        },
        getBusyTime(instrutor, day) {
            busyTime = []
            this.busyTimes.forEach(time => {
                if (time.name === instrutor && time.day === day) {
                    time.times.forEach(hour => {
                        busyTime.push(hour)//stores evry busy hours for a specific day and instructor
                    })
                }
            })
            return busyTime.length > 0 ? busyTime : null;
        },
        isInstructorSuitable(times, busyTime) {
            if (busyTime === null)//if instructor doesnt have any busy time
                return true;
            for (var i = 0; i < times.length; ++i) {
                if (busyTime.indexOf(times[i]) >= 0)
                    return false//return false if any element of time appears in the busyTime list
            }
            return true
        },/*
        displaySchedule() {//to display the schedule on console
            var sc = ""
            console.log("Schedule:\n         |     Year 1     |     Year 2     |     Year 3     |     Year 4    ");
            this.days.forEach(day => {
                console.log(day);
                this.schedule[day].forEach(slot => {
                    const formatTime = time => `${time.split(':')[0].padStart(2, '0')}:${time.split(':')[1]}`;
                    let line = `${formatTime(slot.time)} | `;
                    slot.courses.forEach(course => {
                        line += `${course[1] ? "  "+course[0] + " " + course[1]+"   " : '                 '}  `;
                    });
                    sc = sc + line + "\n";
                    console.log(line);
                });
            });
            return sc;
        }*/
    }
}).mount('#app');
