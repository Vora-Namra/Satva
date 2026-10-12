


export function getNextWeekStartingDay():string{

            const today=new Date();
            const currentDayOfWeek=today.getDay()
            const dayUntilNextMonday=(1+7-currentDayOfWeek)%7 || 7 
            today.setDate(today.getDate()+dayUntilNextMonday)


            return String(today.toISOString().split('T')[0])
           
   
}