const url = "http://localhost:3001/fhir/Patient";
fetch(url).then(res => res.json()).then(data => {
  const pId = data.entry[0].resource.id;
  console.log("Patient ID:", pId);
  const codes = ['8867-4', '8310-5', '9279-1', '59408-5', '8302-2', '29463-7', '39156-5', '55284-4'].join(',');
  const obsUrl = `http://localhost:3001/fhir/Observation?subject=Patient/${pId}&code=${codes}&_sort=-date`;
  return fetch(obsUrl);
}).then(res => res.json()).then(data => {
  console.log("Total Observations:", data.total);
  if (data.entry && data.entry.length > 0) {
    console.log("Sample Observation:", JSON.stringify(data.entry[0].resource, null, 2));
  } else {
    console.log("No observations found!");
  }
}).catch(console.error);
