const app = Vue.createApp({
    data() {
        return {
            days: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
            timeSlot: ["08:30","09:30","10:30","11:30","12:30","13:30","14:30","15:30","16:30"],
            classes: ["First","Second","Third","Fourth"],
            displayProgram: false
        }
    },
    methods: {
        toggleDisplayProgram(){
            this.displayProgram = !this.displayProgram
        },
    }
    
});



app.mount('#app')

