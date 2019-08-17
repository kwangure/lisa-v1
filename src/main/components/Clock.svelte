<script>
    let time

    (function showTime(){
        let date = new Date()
        let hours = date.getHours()
        let minutes = date.getMinutes()
        let session = hours > 11 ? "pm": "am"
        
        hours = hours == 0 ? 12 : hours
        hours = hours > 12 ? hours - 12: hours
        minutes = (minutes < 10) ? "0" + minutes : minutes

        time = `${hours}:${minutes} ${session}`

        setTimeout(showTime, 1000)
    })()

    function randBetween(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
</script>

<div class="time">{time}</div>

<style>
    .time {
        font-size: 80px;
    }
</style>