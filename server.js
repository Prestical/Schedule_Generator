const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('src'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'src', 'index.html'));
});

app.post('/update-data', async (req, res) => {
  const fileName=req.body.fileName;
  const content=req.body.content;
  var csv=null;
  switch(fileName){
    case 'Courses.csv':
    csv=courseToCsv(content);
    break;
    case 'busy.csv':
      csv=busyToCsv(content);
    break;
    case'service.csv':
    csv=serviceToCsv(content);
    break;
    case 'classroom.csv':
      csv=classroomToCsv(content);
    break;
  }
  if(!csv||!fileName){
    return res.status(400).send({ status: 'Error', message: 'No file path or content provided' });
  }
  const file_path=path.join(__dirname, 'src/data', fileName);
  try {
    await fs.writeFile(file_path, csv);
    res.send({ status: 'Success', message: 'File saved successfully' });
  } catch (error) {
    res.status(500).send({ status: 'Error', message: error.message });
  }
  console.log(file_path)
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function courseToCsv(course){
  const val=course.map(c=>Object.values(c));
  const csv=val.map(row => row.join(',')).join('\n');
  return csv;
}
function serviceToCsv(service){
  const val=service.map(c=>Object.values(c));
  val.forEach(v=>{v[2]="\""+v[2].join(",")+"\"";})
  const csv=val.map(row => row.join(',')).join('\n');
  return csv;
}
function busyToCsv(busy){
  const val=busy.map(c=>Object.values(c));
  val.forEach(v=>{v[2]="\""+v[2].join(",")+"\"";})
  const csv=val.map(row => row.join(',')).join('\n');
  return csv;
}
function classroomToCsv(classroom){
  const val=classroom.map(c=>Object.values(c));
  const csv=val.map(row => row.join(';')).join('\n');
  return csv;
}