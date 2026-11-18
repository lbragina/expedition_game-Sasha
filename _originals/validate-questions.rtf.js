{\rtf1\ansi\ansicpg1251\cocoartf2706
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const fs = require('fs');\
const path = require('path');\
\
const QUESTIONS_DIR = path.join(__dirname, 'src', 'data', 'questions');\
\
function validate() \{\
  if (!fs.existsSync(QUESTIONS_DIR)) \{\
    console.error('\uc0\u10060  \u1055 \u1072 \u1087 \u1082 \u1072  \u1085 \u1077  \u1085 \u1072 \u1081 \u1076 \u1077 \u1085 \u1072 :', QUESTIONS_DIR);\
    process.exit(1);\
  \}\
\
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));\
  let allQuestions = [];\
  const ids = new Set();\
  let errors = 0;\
\
  files.forEach(file => \{\
    const raw = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8');\
    let data;\
    try \{\
      data = JSON.parse(raw);\
    \} catch (e) \{\
      console.error(`\uc0\u10060  \u1054 \u1096 \u1080 \u1073 \u1082 \u1072  \u1089 \u1080 \u1085 \u1090 \u1072 \u1082 \u1089 \u1080 \u1089 \u1072  JSON \u1074  \u1092 \u1072 \u1081 \u1083 \u1077  $\{file\}:`, e.message);\
      errors++;\
      return;\
    \}\
\
    if (!Array.isArray(data)) \{\
      console.error(`\uc0\u10060  \u1060 \u1072 \u1081 \u1083  $\{file\} \u1076 \u1086 \u1083 \u1078 \u1077 \u1085  \u1089 \u1086 \u1076 \u1077 \u1088 \u1078 \u1072 \u1090 \u1100  \u1084 \u1072 \u1089 \u1089 \u1080 \u1074  \u1079 \u1072 \u1076 \u1072 \u1095  [...]`);\
      errors++;\
      return;\
    \}\
\
    data.forEach((q, idx) => \{\
      const prefix = `[$\{file\} #$\{idx\} ($\{q.id || 'NO_ID'\})]`;\
\
      if (!q.id) \{ console.error(`$\{prefix\} \uc0\u1054 \u1090 \u1089 \u1091 \u1090 \u1089 \u1090 \u1074 \u1091 \u1077 \u1090  id`); errors++; \}\
      if (ids.has(q.id)) \{ console.error(`$\{prefix\} \uc0\u1044 \u1091 \u1073 \u1083 \u1080 \u1082 \u1072 \u1090  id!`); errors++; \}\
      ids.add(q.id);\
\
      const required = ['category', 'topic', 'difficulty', 'type', 'prompt', 'answer', 'explanation'];\
      required.forEach(field => \{\
        if (q[field] === undefined || q[field] === null || q[field] === '') \{\
          console.error(`$\{prefix\} \uc0\u1055 \u1091 \u1089 \u1090 \u1086 \u1077  \u1086 \u1073 \u1103 \u1079 \u1072 \u1090 \u1077 \u1083 \u1100 \u1085 \u1086 \u1077  \u1087 \u1086 \u1083 \u1077 : $\{field\}`);\
          errors++;\
        \}\
      \});\
\
      if (q.difficulty < 1 || q.difficulty > 10) \{\
        console.error(`$\{prefix\} \uc0\u1057 \u1083 \u1086 \u1078 \u1085 \u1086 \u1089 \u1090 \u1100  \u1076 \u1086 \u1083 \u1078 \u1085 \u1072  \u1073 \u1099 \u1090 \u1100  \u1086 \u1090  1 \u1076 \u1086  10 (\u1089 \u1077 \u1081 \u1095 \u1072 \u1089 : $\{q.difficulty\})`);\
        errors++;\
      \}\
\
      if (q.type === 'choice' && (!Array.isArray(q.options) || q.options.length !== 4)) \{\
        console.error(`$\{prefix\} \uc0\u1044 \u1083 \u1103  \u1090 \u1080 \u1087 \u1072  choice \u1085 \u1091 \u1078 \u1085 \u1086  \u1088 \u1086 \u1074 \u1085 \u1086  4 \u1074 \u1072 \u1088 \u1080 \u1072 \u1085 \u1090 \u1072  \u1074  options`);\
        errors++;\
      \}\
\
      if (q.difficulty >= 4 && (!Array.isArray(q.hints) || q.hints.length < 3)) \{\
        console.warn(`\uc0\u9888 \u65039  $\{prefix\} \u1044 \u1083 \u1103  \u1089 \u1083 \u1086 \u1078 \u1085 \u1086 \u1089 \u1090 \u1080  4+ \u1088 \u1077 \u1082 \u1086 \u1084 \u1077 \u1085 \u1076 \u1091 \u1077 \u1090 \u1089 \u1103  3 \u1091 \u1088 \u1086 \u1074 \u1085 \u1103  \u1087 \u1086 \u1076 \u1089 \u1082 \u1072 \u1079 \u1086 \u1082  (hints)`);\
      \}\
\
      allQuestions.push(q);\
    \});\
  \});\
\
  // \uc0\u1055 \u1088 \u1086 \u1074 \u1077 \u1088 \u1082 \u1072  \u1089 \u1074 \u1103 \u1079 \u1077 \u1081  \u1074  \u1083 \u1077 \u1089 \u1077 \u1085 \u1082 \u1072 \u1093  (ladder)\
  allQuestions.forEach(q => \{\
    if (Array.isArray(q.ladder)) \{\
      q.ladder.forEach(stepId => \{\
        if (!ids.has(stepId)) \{\
          console.error(`\uc0\u10060  [$\{q.id\}] \u1057 \u1089 \u1099 \u1083 \u1082 \u1072  \u1074  ladder \u1085 \u1072  \u1085 \u1077 \u1089 \u1091 \u1097 \u1077 \u1089 \u1090 \u1074 \u1091 \u1102 \u1097 \u1091 \u1102  \u1079 \u1072 \u1076 \u1072 \u1095 \u1091 : $\{stepId\}`);\
          errors++;\
        \}\
      \});\
    \}\
  \});\
\
  console.log(`\\n\uc0\u55357 \u56522  \u1055 \u1088 \u1086 \u1074 \u1077 \u1088 \u1077 \u1085 \u1086  \u1092 \u1072 \u1081 \u1083 \u1086 \u1074 : $\{files.length\}, \u1074 \u1089 \u1077 \u1075 \u1086  \u1079 \u1072 \u1076 \u1072 \u1095 : $\{allQuestions.length\}`);\
  if (errors === 0) \{\
    console.log('\uc0\u9989  \u1048 \u1044 \u1045 \u1040 \u1051 \u1068 \u1053 \u1054 ! \u1054 \u1096 \u1080 \u1073 \u1086 \u1082  \u1074  \u1089 \u1090 \u1088 \u1091 \u1082 \u1090 \u1091 \u1088 \u1077  \u1080  \u1089 \u1074 \u1103 \u1079 \u1103 \u1093  \u1085 \u1077  \u1085 \u1072 \u1081 \u1076 \u1077 \u1085 \u1086 .');\
  \} else \{\
    console.error(`\uc0\u10060  \u1053 \u1072 \u1081 \u1076 \u1077 \u1085 \u1086  \u1082 \u1088 \u1080 \u1090 \u1080 \u1095 \u1077 \u1089 \u1082 \u1080 \u1093  \u1086 \u1096 \u1080 \u1073 \u1086 \u1082 : $\{errors\}`);\
    process.exit(1);\
  \}\
\}\
\
validate();\
}