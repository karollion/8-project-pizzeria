import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;
    thisBooking.tableReservation = [];
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.addClickListenerToTable();
  }

  getData(){
    const thisBooking = this;
    //console.log (thisBooking.datePicker);

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      evestsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log (params);
    const urls = {
      booking:      settings.db.url  + '/' + settings.db.booking 
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event  
                                     + '?' + params.eventsCurrent.join('&'),
      evestsRepeat: settings.db.url  + '/' + settings.db.event   
                                     + '?' + params.evestsRepeat.join('&'),
    };
    //console.log(urls);

    /* get filtred data from db */
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.evestsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const evestsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          evestsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, evestsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(evestsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, evestsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    //console.log('booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking  = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) //> -1
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;

    const bookingHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = bookingHTML;
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.date = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hour = element.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);

    thisBooking.dom.peopleAmount.addEventListener('updated', function(){
    });

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.dom.hoursAmount.addEventListener('updated', function(){
    });

    thisBooking.datePicker = new DatePicker(thisBooking.dom.date);

    
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hour);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
  }

  addClickListenerToTable(){
    const thisBooking = this;

    const tables = document.querySelectorAll(select.booking.tables)
    
    tables.forEach(table => {
      //if(table.classList.contains(classNames.booking.tableBooked)){}
      table.addEventListener("click", (event) => {
        thisBooking.tableClickHandler(event);
      })
    })
  }

  tableClickHandler(event){
    const thisBooking = this;
    event.preventDefault();
    
    const tableId = event.target.getAttribute(settings.booking.tableIdAttribute);
    const table = event.target;
    
    if(!table.classList.contains(classNames.booking.tableBooked)){
      if(!thisBooking.tableReservation.includes(tableId) && thisBooking.tableReservation == 0){
        event.target.classList.add(classNames.booking.tableReservation);
        thisBooking.tableReservation.push(tableId);
      } else {
        event.target.classList.remove(classNames.booking.tableReservation);
        thisBooking.tableReservation.pop(tableId);
      }
    }
    console.log(thisBooking.tableReservation);
  }
  
}
export default Booking