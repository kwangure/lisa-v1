<script>
    //TODO: Look at https://github.com/g1eb/calendar-heatmap
    import { onMount } from 'svelte'
    export let mapData = []

    export let SQUARE_LENGTH = 11
    export let SQUARE_PADDING = 2
    export let MONTH_LABEL_PADDING = 16
    let locale = {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Tue', 'Fri', 'Sat'],
        No: 'No',
        on: 'on',
        Less: 'Less',
        More: 'More'
    };
    export let colorRange = ['#f4f7f7', '#79a8a9']
    export let weekStart = 0 //0 for Sunday, 1 for Monday
    export let startDate = null
    export let endDate = null
    export let dateRange = d3.timeDays(startDate, endDate)
    let firstDate = moment(dateRange[0])
    let counterMap= {}
    let max = mapData && mapData[0].count

    for (let i = 1, len = mapData.length; i < len; i++) {
        let value = mapData[i].count
        max = (value > max) ? value : max
    }

    mapData.forEach(function (element, index) {
        var key = moment(element.date).format( 'YYYY-MM-DD' )
        var counter= counterMap[key] || 0;
        counterMap[key]= counter + element.count
    });

    var color = (d3.scaleLinear)()
      .range(colorRange)
      .domain([0, max])

    function formatWeekday(weekDay) {
      if (weekStart === 1) {
        if (weekDay === 0) {
          return 6
        } else {
          return weekDay - 1
        }
      }
      return weekDay
    }

    function countForDate(d) {
        var key= moment(d).format( 'YYYY-MM-DD' );
        return counterMap[key] || 0;
    }

    function x(d, i) {
        var cellDate = moment(d);
        var result = cellDate.week() - firstDate.week() + (firstDate.weeksInYear() * (cellDate.weekYear() - firstDate.weekYear()));
        return result * (SQUARE_LENGTH + SQUARE_PADDING);
    }

    function y(d, i) {
        return formatWeekday((new Date(d)).getDay()) * (SQUARE_LENGTH + SQUARE_PADDING);
    }

    function dayCellStyle(item, index){
        return `background-color: ${color(countForDate(item.date))};`+ 
        `width: ${SQUARE_LENGTH}px;`+
        `height: ${SQUARE_LENGTH}px;`+
        `top: ${y(item.date, index)}px;`+
        `left: ${x(item.date, index)}px;`
    }

    var monthRange = d3.timeMonths(moment(startDate).startOf('month').toDate(), (new Date(endDate))); 
    
    function month_x(m) {
        var index = dateRange.findIndex((date) => {
            return (m.getMonth() == (new Date(date)).getMonth()) && 
            (m.getFullYear() == (new Date(date)).getFullYear())
        })
        index = index === -1? 0: index;

        return Math.floor(index / 7) * (SQUARE_LENGTH + SQUARE_PADDING) + 28;
    }
</script>

<div class="heatmap">
    <div class='month-name-wrapper'>
        {#each monthRange as month}
            <div class="month-name" style="left: {month_x(month)}px">
                {locale.months[month.getMonth()]}
            </div>
        {/each}
    </div>
    <div class="horizontal">
        <div class="day-name-wrapper">
            {#each locale.days as day, index}
                {#if formatWeekday(index)%2 }
                    <div class="day-name">{day}</div>
                {/if}
            {/each}
        </div>
        <div class="day-cell-wrapper">
            {#each mapData as item, index}
                <span class='day-cell' style={dayCellStyle(item, index)}></span>
            {/each}
        </div>
    </div>
</div>

<style>
    .horizontal {
        display: flex;
    }
    .month-name-wrapper{
        display: flex;
        position: relative;
        padding-left: 28px;
        height: 20px;
    }
    .month-name{
        position: absolute;
        padding: 0 3px;
        font-size: 11px;
    }
    .day-name-wrapper{
        position: relative;
        padding: 0 3px;
    }
    .day-name {
        position: relative; 
        display: block;
        text-align: right;
        font-size: 10px;
        margin-top: 11px;
    }
    .day-cell-wrapper{
        height: 90px;
        position: relative;
    }
    .day-cell{
        position: absolute; 
        display: block;
    }
</style>