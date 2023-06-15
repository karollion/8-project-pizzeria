import { select, templates, settings } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    console.log (thisBooking.datePicker);

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
    console.log(urls);

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
        console.log(bookings);
        console.log(eventsCurrent);
        console.log(evestsRepeat);
      });
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
  }
  
}
export default Booking