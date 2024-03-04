import axios from "axios";

const countVisitors = () => {

  function updateCounter(type: string) {
      axios.get(`${process.env.REACT_APP_CORS_SERVER}/api?` + type);

  }

  if (sessionStorage.getItem('visit') === null) {
    updateCounter('type=visit-pageview');
  } else {
    updateCounter('type=pageview');
  }

  sessionStorage.setItem('visit', "x");
}


export default countVisitors;
