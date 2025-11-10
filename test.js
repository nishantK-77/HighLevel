import http from 'k6/http'

export const options = {
  vus: 1,
  duration: '5s',
  cloud: {
    projectID: 5556129,
    name: 'test.js'
  }
}

export default function () {
  let data = {
    resource_id: 1,
    title: 'Weekly Sync',
    start_time: '2025-11-10T08:00:00',
    end_time: '2025-11-10T09:00:00'
    // recurrence: {
    //   freq: 'DAILY',
    //   interval: 2
    // }
  }

  // Using a JSON string as body
  const url = 'http://127.0.0.1:8080/appointments/create'
  // const url = 'https://www.google.com'
  let res = http.post(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
  console.log(res.json())
}
