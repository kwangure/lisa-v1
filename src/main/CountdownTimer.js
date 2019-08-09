export default class CountDownTimer {
    constructor(duration, granularity) {
        this.duration = duration
        this.granularity = granularity || 1000
        this.tickCallbacks = []
        this.running = false
        this.startTime = Date.now()
        this.diff = duration
        this.timer = this.timer.bind(this)
        this.onTick = this.onTick.bind(this)
        this.start = this.start.bind(this)
        this.isExpired = this.isExpired.bind(this)
        this.format = this.format.bind(this)
    }
  
    start(event){
        if (this.running) { return }
        this.running = true
        this.timer()
    }

    timer() {
        this.diff = this.duration - (((Date.now() - this.startTime) / 1000) || 0)
    
        if (this.diff > 0) {
            setTimeout(this.timer, this.granularity)
        } else {
            diff = 0
            this.running = false
        }
        this.tickCallbacks.forEach(fn => fn())
    }
  
    onTick(fn) {
        if (typeof fn === 'function') {
            this.tickCallbacks.push(fn)
        }
    }
  
    isExpired() {
        return !this.running
    }

    format() {
        let minutes = Math.floor((this.diff / 60) || 0)
        let seconds = Math.floor((this.diff % 60) || 0)
        minutes = minutes < 10 ? "0" + minutes : minutes
        seconds = seconds < 10 ? "0" + seconds : seconds
        return { minutes, seconds }
    }
}