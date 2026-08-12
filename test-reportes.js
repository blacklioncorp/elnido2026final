const { getDatosReporte } = require('./.next/server/app/(admin)/admin/reportes/actions.js') || {};
console.log(getDatosReporte ? "Function found" : "Not found in build, let me just run it using ts-node or next context");
