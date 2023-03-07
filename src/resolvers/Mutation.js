/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { APP_SECRET, chkUserId } from "../utils.js";
// file and path
import { finished } from "stream/promises";
import fs from "fs";
import fsPromises from 'node:fs/promises';
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import jStat from "jstat";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_PATH = '../' + process.env.PUBLIC_PATH;
const DOC_PATH = '../' + process.env.DOC_PATH;
const CASE_PATH = '../' + process.env.CASE_PATH;
const UC_PATH = '../' + process.env.UC_PATH;
const DOCXTEMP_PATH = '../' + process.env.DOCXTEMP_PATH;

async function checktoken(parent, args, context) {
  return chkUserId(context);;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function signup(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.user_password, 10);

  // 2
  const user = await context.prisma.user.create({
    data: { ...args, user_password: password },
  });

  // 3
  const now = new Date();
  const Tlimit = now.getTime() + parseInt(process.env.TTL);
  const token = jwt.sign(
    {
      userId: user.user_name,
      userAc: user.active,
      userRole: user.role,
      expiry: Tlimit,
    },
    APP_SECRET
  );

  // 4
  return {
    token,
    user,
  };
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function login(parent, args, context, info) {
  // 1
  const user = await context.prisma.user.findUnique({
    where: { user_name: args.user_name },
  });
  if (!user) {
    throw new Error("No such user found");
  }else if (user.active === 0) {
    throw new Error("Not active");
  }

  // 2
  const valid = await bcrypt.compare(args.user_password, user.user_password);
  if (!valid) {
    throw new Error("Invalid password");
  }
  const now = new Date();
  const Tlimit = now.getTime() + parseInt(process.env.TTL);
  const token = jwt.sign(
    {
      userId: user.user_name,
      userAc: user.active,
      userRole: user.role,
      expiry: Tlimit,
    },
    APP_SECRET
  );

  // 3
  return {
    token,
    user,
  };
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateUser(parent, args, context) {
  if (chkUserId(context)){
    let tempArgs = { ...args };
    delete tempArgs.id;
    // const password = await bcrypt.hash(args.user_password, 10);
    // , user_password: password 
    try {
      const result = await context.prisma.user.update({
        where: { user_id: args.user_id },
        data: { ...tempArgs},
      });

      return result;
    } catch (e) {
      throw e
    }
  }
}

async function delUser(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.user.delete({
      where: { user_id: args.user_id },
    });
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function chkUserByName(parent, args, context) {
    const where = { user_name: args.user_name };
    const result = await context.prisma.user.findUnique({
      where,
      select: {
        user_name: true,
      },
    });

    return result;
}

async function changePASSWord(parent, args, context) {
  if (chkUserId(context)){
    const user = await context.prisma.user.findUnique({
      where: { user_id: args.user_id },
    });

    // 驗證2次輸入正確
    if(args.newpass !== args.chkpass){
      return "再次確認密碼不同";
    }
    // 非逕行變更則驗證舊密碼
    if (!args.enforce){
      const valid = await bcrypt.compare(args.oldpass, user.user_password);
      if(!valid){
        return "舊密碼錯誤";
      }
    }
    // 更新密碼
    const password = await bcrypt.hash(args.newpass, 10);
    try {
      const result = await context.prisma.user.update({
        where: { user_id: args.user_id },
        data: { user_password: password },
      });

      return "變更完成";
    } catch (e) {
      throw e
    }
  }
}


/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function creatDoc(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.doc.create({
    data: { ...args},
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delDoc(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.doc.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateDoc(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  
  try {
    const result = await context.prisma.doc.update({
      where: { id: args.id },
      data: { ...tempArgs },
    });

    return result;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
      if (e.code === 'P2002') {
        console.log(
          'There is a unique constraint violation, a new user cannot be created with this email'
        )
      }
    }
    throw e
  }
}}

async function uploadDoc(parent, args, context) {
  if (!chkUserId(context)) {
    throw new Error("未經授權");
  }
  const { createReadStream, filename, mimetype, encoding } = await args.file;
  const stream = createReadStream();

  // 檢查資料夾是否存在
  const subpath = path.join(
    __dirname,
    DOC_PATH,
    args.subpath
  );

  const upfilename = args.newfilename;
  const fileresult = await fsPromises.mkdir(
    subpath,
    {recursive: true,},
    (err) => {
      if (err) {
        console.log("error occurred in creating new directory", err);
        return;
  }});

  // 開始寫入檔案
  const out = fs.createWriteStream(path.join(subpath, upfilename));
  stream.pipe(out);
  await finished(out);

  // console.log("upload finished!!");
  return { filename: upfilename, mimetype: mimetype, encoding: encoding };
}

async function uploadFile(parent, args, context) {
  if (!chkUserId(context)) {
    throw new Error("未經授權");
  }
  const { createReadStream, filename, mimetype, encoding } = await args.file;
  const stream = createReadStream();

  // 檢查資料夾是否存在
  const subpath = path.join(
    __dirname,
    PUBLIC_PATH,
    args.subpath
  );

  const upfilename = args.newfilename;
  const fileresult = await fsPromises.mkdir(
    subpath,
    {recursive: true,},
    (err) => {if (err) {console.log("error occurred in creating new directory", err);
        return;
  }});

  // console.log(fileresult);
  // 開始寫入檔案
  const out = fs.createWriteStream(path.join(subpath, upfilename));
  stream.pipe(out);
  await finished(out);

  // console.log("upload finished!!");
  return { filename: upfilename, mimetype: mimetype, encoding: encoding };
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCase(parent, args, context) {
  if (chkUserId(context)){
    let filter = [];
    for (let key in args) {
      if (args[key]) {
        let myObj = new Object();
        switch (key) {
          // ---------------------
          case "appdate_start":
            if (args["appdate_end"]) {
              // with start and end
              myObj["app_date"] = {
                gte: args[key],
                lte: args["appdate_end"],
              };
            } else {
              // only has start
              myObj["app_date"] = {
                gte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "appdate_end":
            if (args["appdate_start"]) {
              // 前面已經有處理
            } else {
              // only has end
              myObj["app_date"] = {
                lte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "paydate_start":
            if (args["paydate_end"]) {
              // with start and end
              myObj["pay_date"] = {
                gte: args[key],
                lte: args["paydate_end"],
              };
            } else {
              // only has start
              myObj["pay_date"] = {
                gte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "paydate_end":
            if (args["paydate_start"]) {
              // 前面已經有處理
            } else {
              // only has end
              myObj["pay_date"] = {
                lte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "id":
            myObj[key] = { contains: args[key] };
            filter.push(myObj);
            break;
          case "org_id":
            myObj = { cus: { org_id: args[key] } };
            filter.push(myObj);
            break;
          case "item_chop":
            myObj = { item_base: { chop: args[key] } };
            filter.push(myObj);
            break;
          case "item_model":
            myObj = { item_base: { model: args[key] } };
            filter.push(myObj);
            break;
          case "item_sn":
            myObj = { item_base: { serial_number: { contains: args[key] } } };
            filter.push(myObj);
            break;
          case "sign_person_id":
            myObj = { OR: [
              {case_record_01: { is:{sign_person_id: args.sign_person_id}}},
              {case_record_02: { is:{sign_person_id: args.sign_person_id}}},
              {case_record_03: { is:{sign_person_id: args.sign_person_id}}}
            ] };
            filter.push(myObj);
            break;
          case "not_status":
            myObj = { 
              status_code: {
                not: parseInt(args.not_status),
              }
            };
            filter.push(myObj);
            break;
          default:
            myObj[key] = args[key];
            filter.push(myObj);
        }
      }
    }
    
    const where = { AND: filter };
    // console.log(args)
    // console.log(where)
    const result = await context.prisma.case_base.findMany({
      where,
    });

    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCasebyID(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCaseStatus(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.case_status.findMany();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCaseCalType(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.cal_type.findMany();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
 async function getAllItem(parent, args, context) {
  if (chkUserId(context)) {
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        switch(key){
          case "chop":
          case "model":
          case "serial_number":
            filter[key] = { contains: args[key] };
            break;
          case "type":
            if(args.type===3 || args.type===4){
              filter.type = { in: [args.type, 5] };
            }else{
              filter.type = args.type;
            }
          case "org_id":
            if (args.org_id) {
              filter.case_base = { some:{ cus:{ is:{org_id: args.org_id}}}};
            }
            break;
        }
      }
    }

    const result = await context.prisma.item_base.findMany({
      where:filter,
    });
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getItemByID(parent, args, context) {
  if (chkUserId(context)) {
    if (args.id){
      return await context.prisma.item_base.findUnique({
        where: { id: args.id },
      });
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllItemType(parent, args, context) {
  if (chkUserId(context)) {
    const result = await context.prisma.item_type.findMany();
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllRecord01(parent, args, context) {
  if (chkUserId(context)) {
    const result = await context.prisma.case_record_01.findMany();
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCust(parent, args, context) {
  if (chkUserId(context)){
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        switch(key){
          case "name":
            filter.name = {contains: args.name};
            break;
          case "org_name":
            if (filter.cus_org){
              filter.cus_org.name = {contains: args.org_name} 
            }else{
              filter.cus_org = {name: {contains: args.org_name,}}
            }
            break;
          case "org_taxid":
            if (filter.cus_org){
              filter.cus_org.tax_id = {contains: args.org_taxid} 
            }else{
              filter.cus_org = {tax_id: {contains: args.org_taxid,}}
            }
            break;
          case "org_id":
            filter.org_id = args.org_id;
            break;
        }
      }
    }

    const result = await context.prisma.cus.findMany({
      where:filter,
    });

  return result; }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCustById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllOrg(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus_org.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getOrgById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus_org.findUnique({
    where: { id: args.id },
  });}
}


/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function creatCase(parent, args, context) {
  if (chkUserId(context)){
    const cal_charge = await context.prisma.cal_type.findUnique({
      where: {
        id: args.cal_type,
      },
    });
    const result = await context.prisma.case_base.create({
      data: {
        id: args.id,
        cal_type: args.cal_type,
        status_code: 1,
        app_date: args.app_date,
        purpose: args.purpose,
        charge: cal_charge.charge,
        operators_id: args.operators_id,
      },
    });


    switch (args.cal_type) {
      case 3:
      case 1:
        // 航測像機
        const record_01 = await context.prisma.case_record_01.create({
          data: {
            id: args.id,
            cam_type: (args.cal_type===3)?3:null,
          },
        });
        break;
      case 2:
        // 空載光達
        const record_02 = await context.prisma.case_record_02.create({
          data: { id: args.id },
        });
        break;
      case 9:
          // 車載光達
          const record_03 = await context.prisma.case_record_03.create({
            data: { id: args.id },
          });
          break;
      default:
        throw new Error("Invalid cal_type!!");
    }
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delCase(parent, args, context) {
  if (chkUserId(context)){
  const getcase = await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });

  switch (getcase.cal_type) {
    case 1:
    case 3:
      // 航測像機
      const record01 = await context.prisma.case_record_01.delete({
        where: { id: args.id },
      });
      break;
    case 2:
      // 空載光達
      const record02 = await context.prisma.case_record_02.delete({
        where: { id: args.id },
      });
      break;
    case 9:
      // 車載光達
      const record03 = await context.prisma.case_record_03.delete({
        where: { id: args.id },
      });
      break;
  }
  const result = await context.prisma.case_base.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateCase(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.case_base.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRecord01(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { 
    ...args, 
    // recal_table: JSON.parse(args.recal_table),
    // uccal_table: JSON.parse(args.uccal_table),
  };
  delete tempArgs.id;
  const result = await context.prisma.case_record_01.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRecord02(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { 
    ...args, 
    // recal_table: JSON.parse(args.recal_table),
    // uccal_table: JSON.parse(args.uccal_table),
  };
  delete tempArgs.id;
  const result = await context.prisma.case_record_02.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRecord03(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { 
    ...args, 
    // recal_table: JSON.parse(args.recal_table),
    // uccal_table: JSON.parse(args.uccal_table), 
  };
  delete tempArgs.id;
  const result = await context.prisma.case_record_03.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createItem(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.item_base.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delItem(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.item_base.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateItem(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.item_base.upsert({
    where: { id: args.id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createItemType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.item_type.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delItemType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.item_type.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateItemType(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.item_type.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getItemBySN(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.item_base.findMany({
    where: { serial_number: args.serial_number },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createCust(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.cus.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delCust(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.cus.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateCust(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.cus.upsert({
    where: { id: args.id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });

  return result;}
}
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCustByName(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.cus.findMany({
    where: { name: args.name },

  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createOrg(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.cus_org.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delOrg(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.cus_org.delete({
    where: { id: args.id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateOrg(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.cus_org.upsert({
    where: { id: args.id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllEmp(parent, args, context) {
  if (chkUserId(context)){
    let result;
    if(args.isRes){
      result = await context.prisma.employee.findMany();
    }else{
      result = await context.prisma.employee.findMany(
        {where: { resignation_date: null },}
      );
    }
  return result }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEmpById(parent, args, context) {
  if (chkUserId(context)){
    if(args.person_id){
      return await context.prisma.employee.findUnique({
        where: { person_id: args.person_id },
      });
    }else{
      return null;
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEmpByRole(parent, args, context) {
  if (chkUserId(context)) {
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        filter[key] = args[key];
      }
    }

    let result = await context.prisma.employee.findMany({
      where: {
        employee_empower: {
          some: filter,
        },
      },
    });
    return result;
  }
}

async function getEmpRoleList(parent, args, context) {
  if (chkUserId(context)) {
    let result = await context.prisma.employee_role.findMany();
    return result;
  }
}

async function getEmpowerbyRole(parent, args, context) {
  if (chkUserId(context)){
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        switch (key){
          case 'role_type':
            filter[key] = { contains: args[key]};
            break;
          default:
            filter[key] = args[key];
        }
      }
    }
    if (Object.keys(filter).length === 0){
      return []
    }else{
      const where = { AND: filter };
      let result = await context.prisma.employee_empower.findMany({
        where,
      });
      return result;
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEmpowerByPerson(parent, args, context) {
  if (chkUserId(context)){
    if(args.person_id){
      return await context.prisma.employee_empower.findMany({
        where: { person_id: args.person_id },
      });
    }else {
      return [];
    }
  }
}

async function getAllTrain(parent, args, context) {
  if (chkUserId(context)){
    let result = await context.prisma.employee_train.findMany();
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmp(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmp(parent, args, context) {
  if (chkUserId(context)){
    try {
      const result = await context.prisma.employee.delete({
        where: { person_id: args.person_id },
      });
      console.log(result);
      return result;
    }
    catch (e){
      throw new Error("Foreign key constraint failed");
    }
  }
  
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateEmp(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.employee.upsert({
    where: { person_id: args.person_id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmpRole(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_role.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmpRole(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_role.delete({
    where: { role_type: args.role_type },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
 async function getEmpowerByID(parent, args, context) {
  if (chkUserId(context)){
    if(args.empower_id){
      const result = await context.prisma.employee_empower.findUnique({
        where: { empower_id: args.empower_id },
      });
      return result;
    }else{
      return null;
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmpower(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_empower.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmpower(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_empower.delete({
    where: { empower_id: args.empower_id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateEmpower(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.empower_id;
  const result = await context.prisma.employee_empower.update({
    where: { empower_id: args.empower_id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
 async function getTrainByID(parent, args, context) {
  if (chkUserId(context)){
    if(args.train_id){
      const result = await context.prisma.employee_train.findUnique({
        where: { train_id: args.train_id },
      });  
      return result;
    }else{
      return null;
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getTrainByPerson(parent, args, context) {
  if (chkUserId(context)){
    if(args.person_id){
      return await context.prisma.employee_train.findMany({
        where: { person_id: args.person_id },
      });
    }else {
      return [];
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createTrain(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_train.create({
    data: { ...args },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delTrain(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.employee_train.delete({
    where: { train_id: args.train_id },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateTrain(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.train_id;
  const result = await context.prisma.employee_train.update({
    where: { train_id: args.train_id },
    data: { ...tempArgs },
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefPrj(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_project.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefPrj(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_project.delete({
    where: { id: args.id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefPrj(parent, args, context) {
  if (chkUserId(context)){
    let tempArgs = { ...args };
    delete tempArgs.id;
    const result = await context.prisma.ref_project.upsert({
      where: { id: args.id },
      update: { ...tempArgs },
      create: { ...tempArgs },
    });
    return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function addPrjEqptKey(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_use_eqpt.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function removePrjEqptKey(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_use_eqpt.delete({
    where: { id: args.id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updatePrjEqptKey(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;

  const hasKey = await context.prisma.ref_project.count({
    where: {
      AND: { project_id: args.project_id, eqpt_check_id: args.eqpt_check_id },
    },
  });

  if (hasKey > 0) {
    throw new Error("data duplication!!");
  } else {
    const result = await context.prisma.ref_project.update({
      where: { id: args.id },
      data: { ...tempArgs },
    });
  }
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptByPrj(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_use_eqpt.findMany({
    where: { project_id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_eqpt.findUnique({
    where: { ref_equpt_id: args.ref_equpt_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptChopList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.ref_eqpt.groupBy({
      by: ['chop'],
    });
    let list = [];
    result.map(x=>{
      if(x.chop){
        list.push(x.chop);
      }
    })
    return list.sort();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptModelList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.ref_eqpt.groupBy({
      by: ['model'],
    });
    let list = [];
    result.map(x=>{
      if(x.model){
        list.push(x.model);
      }
    })
    return list.sort();
  }
}


/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqpt(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqpt(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt.delete({
    where: { ref_equpt_id: args.ref_equpt_id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqpt(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.ref_equpt_id;
  const result = await context.prisma.ref_eqpt.upsert({
    where: { ref_equpt_id: args.ref_equpt_id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqptType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt_type.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqptType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt_type.delete({
    where: { eqpt_type_id: args.eqpt_type_id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqptType(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.eqpt_type_id;
  const result = await context.prisma.ref_eqpt.update({
    where: { eqpt_type_id: args.eqpt_type_id },
    data: { ...tempArgs },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getChkById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_eqpt_check.findUnique({
    where: { eq_ck_id: args.eq_ck_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getChkByEqptId(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_eqpt_check.findMany({
    where: { ref_eqpt_id: args.ref_eqpt_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllChkOrgList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.ref_eqpt_check.groupBy({
      by: ['cal_org'],
    });
    let orgList = [];
    result.map(x=>{
      orgList.push(x.cal_org);
    })
    return orgList.sort();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqptChk(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt_check.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqptChk(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_eqpt_check.delete({
    where: { eq_ck_id: args.eq_ck_id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqptChk(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.eq_ck_id;
  const result = await context.prisma.ref_eqpt_check.upsert({
    where: { eq_ck_id: args.eq_ck_id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });
  return result;}
}

async function calRefGcp(parent, args, context) {
  if (chkUserId(context)) {
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        switch (key) {
          case "project_id":
          case "status":
            filter[key] = args[key];
            break;
          case "cal_type_id": //1:大像幅;2:中像幅;3:小像幅;4:光達
            if (args.cal_type_id === 1) {
              filter["gcp"] = {
                is: { OR: [{ type_code: 5 }, { type_code: 35 }] },
              };
            } else if (args.cal_type_id === 2 || args.cal_type_id === 3) {
              filter["gcp"] = {
                is: { OR: [{ type_code: 7 }, { type_code: 35 }] },
              };
            } else if (args.cal_type_id === 4) {
              filter["gcp"] = {
                is: { type_code: 13 },
              };
            }
            break;
        }
      }
    }
    return await context.prisma.gcp_record.findMany({
      where: filter,
    });
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllGcp(parent, args, context) {
  if (chkUserId(context)){
    let filter = {};
    let subdata;
    if(args.project_id || args.project_id===0){
      // 有計畫編號則查詢全紀錄
      filter.gcp_record = {
        some: {project_id: args.project_id}
      };
      subdata = { 
        gcp_record:{ 
          where: {
            project_id: args.project_id
          },
          take: 1
        }
      };
    }else{
      // 無計畫編號則查詢最新紀錄
      subdata = { 
        gcp_record:{ 
          orderBy:{date: 'desc'},
          take: 1
        }
      };
    }
    
    for (let key in args) {
      if (args[key] || args[key]===0) {
        switch(key){
          case "project_id":
          case "status":
            break;
          default:
            filter[key] = args[key];
        }
      }
    }
    // include的條件無法作用是因為graphQL的解析器，在prisma將查詢解果之後運作，所以儘管用prisma的include進行關聯資料的選取，最後還是會被graphQL的關聯欄位解析器結果所覆蓋，因此必須取消graphQL的關聯欄位解析器，查詢以prisma的結果為準。
    const result = await context.prisma.gcp.findMany({
      where:filter,
      include:subdata,
    });
    let myarray=[];
    // 針對點位狀態做最終篩選
    // 因include中內容篩選程序優先於取得最新紀錄，在無法對調優先序的情況下，只能先取得最新紀錄後，再進行內容篩選
    // console.log(args.status);
    if(args.status || args.status===0){
      result.map(x=>{
        if(x.gcp_record[0].status===args.status){
          return myarray.push(x);
        }})
    }else{
      myarray = result;
    }
    return myarray;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordByPrjId(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findMany({
    where: { project_id: args.project_id },
  });}
}
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllGcpStyleList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.gcp.groupBy({
      by: ['style'],
    });
    // console.log('result',result)
    let nameList = [];
    result.map(x=>{
      if(x.style){
        nameList.push(x.style);
      }else{
        nameList.push('');
      }
    })
    // console.log('nameList',nameList)
    return nameList.sort();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllRecPersonList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.gcp_record.groupBy({
      by: ['person'],
    });
    let nameList = [];
    result.map(x=>{
      if(x.person){
        nameList.push(x.person);
      }else{
        nameList.push('');
      }
    })
    return nameList.sort();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordsByGCPId(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findMany({
    where: { gcp_id: args.gcp_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGCP(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGCP(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp.delete({
    where: { id: args.id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGCP(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  const result = await context.prisma.gcp.upsert({
    where: { id: args.id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpRecord(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_record.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function inputGCPRecords(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_record.createMany({
    data: args.records,
  });
  // console.log(result);
    return result.count;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delPrjEqptUse(parent, args, context) {
  if (chkUserId(context)){
    if(args.recordsId){
      if(args.recordsId.length>0){
        const result = await context.prisma.ref_use_eqpt.deleteMany({
          where: {
            id: { in: args.recordsId },
          },
        });
        // console.log(result);
        return result.count;
      }
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function savePrjEqptUse(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.ref_use_eqpt.createMany({
    data: args.records,
  });
  // console.log(result);
    return result.count;
  }
}



/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpRecord(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_record.delete({
    where: { id: args.id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpRecord(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.gcp_record.upsert({
    where: { id: args.id },
    update: { ...tempArgs },
    create: { ...tempArgs },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_type.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpType(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_type.delete({
    where: { code: args.code },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpType(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.code;
  const result = await context.prisma.gcp_type.update({
    where: { code: args.code },
    data: { ...tempArgs },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpContact(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_contact.create({
    data: { ...args },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpContact(parent, args, context) {
  if (chkUserId(context)){
  const result = await context.prisma.gcp_contact.delete({
    where: { id: args.id },
  });
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpContact(parent, args, context) {
  if (chkUserId(context)){
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.gcp_contact.upsert({
    where: { id: args.id },
    update: { ...tempArgs, },
    create: { ...tempArgs },
  });
  return result;}
} 

async function computeUc(parent, args, context) {
  if (chkUserId(context)){
    let parm = JSON.parse(args.parm);
    let filepathname = path.join(
      __dirname,
      UC_PATH, args.uc_model
    );

    let result = fsPromises.readFile(filepathname)
      .then(function(ucData) {
        let UcResult = JSON.parse(ucData);
        let UcModule = JSON.parse(ucData);
        let myData = UcModule.data;

        switch (UcModule.calType) {
          case "F":
          case "J":
            // 將校正件資料填入
            myData[2].data[0].x[0] = parm.sx;
            UcResult.data[2].data[0].x[0] = parm.sx;
            myData[2].data[0].x[1] = parm.sy;
            UcResult.data[2].data[0].x[1] = parm.sy;
            myData[2].data[0].fr[0] = parm.redundancy;
            UcResult.data[2].data[0].fr[0] = parm.redundancy;
            myData[2].data[1].x[0] = parm.gsd;
            UcResult.data[2].data[1].x[0] = parm.gsd;
    
            myData[5].data[0].x[0] = parm.sz;
            UcResult.data[5].data[0].x[0] = parm.sz;
            myData[5].data[0].fr[0] = parm.redundancy;
            UcResult.data[5].data[0].fr[0] = parm.redundancy;
            myData[5].data[1].x[0] = parm.gsd;
            UcResult.data[5].data[1].x[0] = parm.gsd;
            
            break;
          case "I":
            // 將校正件資料填入  
            if(UcModule.parmtype === 'A'){
              // POS規格平面精度(mm) posH
              myData[4].data[0].x[1] = parm.posH;
              UcResult.data[4].data[0].x[1] = parm.posH;

              // 最少點雲數 minpt
              myData[4].data[0].fa[0] = parm.minpt;
              UcResult.data[4].data[0].fa[0] = parm.minpt;
              myData[4].data[1].fa[0] = parm.minpt;
              UcResult.data[4].data[1].fa[0] = parm.minpt;

              myData[10].data[0].fa[0] = parm.minpt;
              UcResult.data[10].data[0].fa[0] = parm.minpt;
              myData[10].data[1].fa[0] = parm.minpt;
              UcResult.data[10].data[1].fa[0] = parm.minpt;

              // POS測角解析度(秒) posOri
              myData[4].data[1].x[1] = parm.posOri;
              UcResult.data[4].data[1].x[1] = parm.posOri;
              myData[10].data[1].x[1] = parm.posOri;
              UcResult.data[10].data[1].x[1] = parm.posOri;

              // POS規格Phi精度(秒) posPhi
              myData[4].data[1].x[2] = parm.posPhi;
              UcResult.data[4].data[1].x[2] = parm.posPhi;
              myData[10].data[1].x[2] = parm.posPhi;
              UcResult.data[10].data[1].x[2] = parm.posPhi;

              // POS規格Omega精度(秒) posOmg
              myData[4].data[1].x[3] = parm.posPhi;
              UcResult.data[4].data[1].x[3] = parm.posPhi;
              myData[10].data[1].x[3] = parm.posPhi;
              UcResult.data[10].data[1].x[3] = parm.posPhi;

              // POS規格Kappa精度(秒) posKap
              myData[4].data[1].x[4] = parm.posKap;
              UcResult.data[4].data[1].x[4] = parm.posKap;
              myData[10].data[1].x[4] = parm.posKap;
              UcResult.data[10].data[1].x[4] = parm.posKap;

              // 飛行離地高(m) agl
              myData[4].data[1].x[5] = parm.agl;
              UcResult.data[4].data[1].x[5] = parm.agl;
              myData[10].data[1].x[5] = parm.agl;
              UcResult.data[10].data[1].x[5] = parm.agl;

              // 最大掃描角(度) fov
              myData[4].data[1].x[6] = parm.fov;
              UcResult.data[4].data[1].x[6] = parm.fov;
              myData[10].data[1].x[6] = parm.fov;
              UcResult.data[10].data[1].x[6] = parm.fov;

              // LiDAR規格測距精度(mm) lrdis
              myData[4].data[1].x[7] = parm.lrdis;
              UcResult.data[4].data[1].x[7] = parm.lrdis;
              myData[10].data[1].x[7] = parm.lrdis;
              UcResult.data[10].data[1].x[7] = parm.lrdis;

              // LiDAR規格雷射擴散角(秒) lrbeam
              myData[4].data[1].x[8] = parm.lrbeam;
              UcResult.data[4].data[1].x[8] = parm.lrbeam;
              myData[10].data[1].x[8] = parm.lrbeam;
              UcResult.data[10].data[1].x[8] = parm.lrbeam;

              // LiDAR規格掃描角解析度(秒) lrang
              myData[4].data[1].x[9] = parm.lrang;
              UcResult.data[4].data[1].x[9] = parm.lrang;
              myData[10].data[1].x[9] = parm.lrang;
              UcResult.data[10].data[1].x[9] = parm.lrang;

              // POS規格高程精度(mm) posV
              myData[10].data[0].x[1] = parm.posV;
              UcResult.data[10].data[0].x[1] = parm.posV;
            }else if(UcModule.parmtype === 'B'){
              // POS規格平面精度(mm) posH
              myData[4].data[0].x[0] = parm.posH;
              UcResult.data[4].data[0].x[0] = parm.posH;

              // POS規格高程精度(mm) posV
              myData[10].data[0].x[0] = parm.posV;
              UcResult.data[10].data[0].x[0] = parm.posV;

              // 最少點雲數 minpt
              myData[4].data[0].fa[0] = parm.minpt;
              UcResult.data[4].data[0].fa[0] = parm.minpt;

              myData[10].data[0].fa[0] = parm.minpt;
              UcResult.data[10].data[0].fa[0] = parm.minpt;
            }
            break;
          case "M":
            // 將校正件資料填入  
            if(UcModule.parmtype === 'A'){
              // POS規格平面精度(mm) posH
              myData[4].data[0].x[1] = parm.posH;
              UcResult.data[4].data[0].x[1] = parm.posH;

              // 最少點雲數 minpt
              myData[4].data[0].fa[0] = parm.minpt;
              UcResult.data[4].data[0].fa[0] = parm.minpt;
              myData[4].data[1].fa[0] = parm.minpt;
              UcResult.data[4].data[1].fa[0] = parm.minpt;

              myData[10].data[0].fa[0] = parm.minpt;
              UcResult.data[10].data[0].fa[0] = parm.minpt;
              myData[10].data[1].fa[0] = parm.minpt;
              UcResult.data[10].data[1].fa[0] = parm.minpt;

              // POS測角解析度(秒) posOri
              myData[4].data[1].x[1] = parm.posOri;
              UcResult.data[4].data[1].x[1] = parm.posOri;
              myData[10].data[1].x[1] = parm.posOri;
              UcResult.data[10].data[1].x[1] = parm.posOri;

              // POS規格Phi精度(秒) posPhi
              myData[4].data[1].x[2] = parm.posPhi;
              UcResult.data[4].data[1].x[2] = parm.posPhi;
              myData[10].data[1].x[2] = parm.posPhi;
              UcResult.data[10].data[1].x[2] = parm.posPhi;

              // POS規格Omega精度(秒) posOmg
              myData[4].data[1].x[3] = parm.posPhi;
              UcResult.data[4].data[1].x[3] = parm.posPhi;
              myData[10].data[1].x[3] = parm.posPhi;
              UcResult.data[10].data[1].x[3] = parm.posPhi;

              // POS規格Kappa精度(秒) posKap
              myData[4].data[1].x[4] = parm.posKap;
              UcResult.data[4].data[1].x[4] = parm.posKap;
              myData[10].data[1].x[4] = parm.posKap;
              UcResult.data[10].data[1].x[4] = parm.posKap;

              // 飛行離地高(m) agl
              myData[4].data[1].x[5] = parm.agl;
              UcResult.data[4].data[1].x[5] = parm.agl;
              myData[10].data[1].x[5] = parm.agl;
              UcResult.data[10].data[1].x[5] = parm.agl;

              // 最大掃描角(度) fov
              myData[4].data[1].x[6] = parm.fov;
              UcResult.data[4].data[1].x[6] = parm.fov;
              myData[10].data[1].x[6] = parm.fov;
              UcResult.data[10].data[1].x[6] = parm.fov;

              // LiDAR規格測距精度(mm) lrdis
              myData[4].data[1].x[7] = parm.lrdis;
              UcResult.data[4].data[1].x[7] = parm.lrdis;
              myData[10].data[1].x[7] = parm.lrdis;
              UcResult.data[10].data[1].x[7] = parm.lrdis;

              // LiDAR規格雷射擴散角(秒) lrbeam
              myData[4].data[1].x[8] = parm.lrbeam;
              UcResult.data[4].data[1].x[8] = parm.lrbeam;
              myData[10].data[1].x[8] = parm.lrbeam;
              UcResult.data[10].data[1].x[8] = parm.lrbeam;

              // LiDAR規格掃描角解析度(秒) lrang
              myData[4].data[1].x[9] = parm.lrang;
              UcResult.data[4].data[1].x[9] = parm.lrang;
              myData[10].data[1].x[9] = parm.lrang;
              UcResult.data[10].data[1].x[9] = parm.lrang;

              // POS規格高程精度(mm) posV
              myData[10].data[0].x[1] = parm.posV;
              UcResult.data[10].data[0].x[1] = parm.posV;
            }else if(UcModule.parmtype === 'B'){
              // POS規格平面精度(mm) posH
              myData[4].data[0].x[0] = parm.posH;
              UcResult.data[4].data[0].x[0] = parm.posH;

              // POS規格高程精度(mm) posV
              myData[10].data[0].x[0] = parm.posV;
              UcResult.data[10].data[0].x[0] = parm.posV;

              // 最少點雲數 minpt
              myData[4].data[0].fa[0] = parm.minpt;
              UcResult.data[4].data[0].fa[0] = parm.minpt;

              myData[10].data[0].fa[0] = parm.minpt;
              UcResult.data[10].data[0].fa[0] = parm.minpt;
            }
            break;
        }

        return getUcResult(myData,UcResult);

      })
      .catch(function(error) {
        console.log(error);
      })

    return result; 
}}

async function getUcResultformJson(parent, args, context) {
  if (chkUserId(context)){
    let filepathname = path.join(
      __dirname,
      UC_PATH, args.filename
    );

    let result = fsPromises.readFile(filepathname)
    .then(function(ucData) {
      let UcResult = JSON.parse(ucData);
      let UcModule = JSON.parse(ucData);
      let myData = UcModule.data;

      return getUcResult(myData,UcResult);

    })
    .catch(function(error) {
      console.log(error);
    })

    return result; 
}}

async function getUcResult(myData,UcResult){
  let ucH = 0.0;
  let ucV = 0.0;
  let ucH_s = 0.0;
  let ucV_s = 0.0;
  let ucH_o = 0.0;
  let ucV_o = 0.0;
  let freeH = 0;
  let freeV = 0;
  let tinvH = 0;
  let tinvV = 0;
  let sectionUx = 0;
  let sectionFr = 0;

  // 開始計算
  for (let i = 0; i < myData.length; i++) {
    // section 循環
    sectionUx = 0;
    sectionFr = 0;
    let sectionFr0 = 0;
    for (let j = 0; j < myData[i].data.length; j++) {
      // subitem 循環
      let parms = myData[i].data[j].x;
      parms.map(x=>{return parseFloat(x)});
      UcResult.data[i].data[j].ux = eval(myData[i].data[j].ux);
      // console.log(UcResult.data[i].section,UcResult.data[i].data[j].name ,UcResult.data[i].data[j].ux);

      let pUx = parms.map(x=>{return x});
      parms = myData[i].data[j].fr;
      parms.map(x=>{return parseFloat(x)})
      UcResult.data[i].data[j].freedom = eval(myData[i].data[j].freedom);

      parms = myData[i].data[j].fa;
      parms.map(x=>{return parseFloat(x)})
      UcResult.data[i].data[j].factor = eval(myData[i].data[j].factor);
      
      let calcUx = (UcResult.data[i].data[j].ux * UcResult.data[i].data[j].factor) ** 2;
      let calcFr = ((UcResult.data[i].data[j].ux * UcResult.data[i].data[j].factor) ** 4) / UcResult.data[i].data[j].freedom;
      if (myData[i].type === "平面") {
        ucH_s = ucH_s + calcUx;
        freeH = freeH + calcFr;
      } else if (myData[i].type === "高程") {
        ucV_s = ucV_s + calcUx;
        freeV = freeV + calcFr;
      }
      sectionUx = sectionUx + calcUx;
      sectionFr = sectionFr + calcFr;
      sectionFr0=sectionFr0+UcResult.data[i].data[j].freedom;
    }

    sectionUx = sectionUx ** 0.5;
    if(sectionFr===0){
      sectionFr=sectionFr0;
    }else{
      sectionFr = sectionUx ** 4 / sectionFr;
    }

    UcResult.data[i].combUx = sectionUx;
    UcResult.data[i].combFr = sectionFr;
  }
  ucH_s = ucH_s ** 0.5;
  freeH = ucH_s ** 4 / freeH;
  tinvH = jStat.studentt
    .inv(1 - (1 - parseFloat(UcResult.confLevel)) / 2, freeH);
  ucH_o = floatify(tinvH * ucH_s);
  if (ucH_o < parseFloat(UcResult.minUcH)) {
    ucH = parseFloat(UcResult.minUcH);
  }else{
    ucH = ucH_o;
  }
  ucV_s = ucV_s ** 0.5;
  freeV = ucV_s ** 4 / freeV;
  tinvV = jStat.studentt
    .inv(1 - (1 - parseFloat(UcResult.confLevel)) / 2, freeV);
  ucV_o = floatify(tinvV * ucV_s);
  if (ucV_o < parseFloat(UcResult.minUcV)) {
    ucV = parseFloat(UcResult.minUcV);
  }else{
    ucV = ucV_o;
  }

  UcResult.ucH = ucH;
  UcResult.ucH_s = ucH_s;
  UcResult.ucH_o = ucH_o;
  let fixresultH = getDigPos(ucH, 2);
  UcResult.digPosH = fixresultH.DigPos;
  UcResult.fixUcH = fixresultH.fixUc;
  UcResult.freeH = freeH;
  UcResult.tinvH = tinvH.toFixed(2);
  
  UcResult.ucV = ucV;
  UcResult.ucV_s = ucV_s;
  UcResult.ucV_o = ucV_o;
  let fixresultV = getDigPos(ucV, 2);
  UcResult.digPosV = fixresultV.DigPos;
  UcResult.fixUcV = fixresultV.fixUc;
  UcResult.freeV = freeV;
  UcResult.tinvV = tinvV.toFixed(2);
  // console.log(UcResult);
  return UcResult;
}

function getDigPos(uc,signDig){
  // console.log("uc",uc,"signDig",signDig);
  // signDig有效位數通常取2
  let numstr = uc.toExponential(signDig*2).split("e");
  // console.log("numstr",numstr);
  // 檢查位置
  let chkPos = (signDig === 1) ? 2 : (signDig+1);
  // console.log("chkPos",chkPos);
  let temp = parseFloat(numstr[0]) * 10 ** (chkPos - 2);
  // console.log("temp",temp);
  let truePow = parseInt(numstr[1]) + 2 - chkPos;
  // console.log("truePow",truePow);
  let fixUc = 0.0;
  // console.log("charAt",numstr[0].charAt(chkPos));
  if(numstr[0].charAt(chkPos) === '0' || numstr[0].charAt(chkPos) === ''){
    // 捨去
    fixUc = Math.trunc(temp) * (10 ** truePow);
    // console.log("捨去",fixUc);
  }else{
    // 進位
    fixUc = (Math.trunc(temp) + 1) * (10 ** truePow);
    // console.log("進位",fixUc);
  };
  numstr = fixUc.toExponential(signDig*2).split("e");
  // console.log("numstr",numstr);
  let DigPos = parseInt(numstr[1]) - signDig + 1;
  // console.log("DigPos",DigPos);
  return { fixUc, DigPos };
}

async function getUclist(parent, args, context) {
  if (chkUserId(context)){
    let subpath = path.join(
      __dirname,
      UC_PATH
    );
    let result = await fsPromises.readdir(subpath);
    if(args.caltypecode && args.refprjcode){
      let argStr = args.caltypecode.trim() + "_" + args.refprjcode.trim();
      result = result.filter((x) => x.indexOf(argStr) > -1);
    }
    let a = result.indexOf('temp.json');
    if(a>0){
      result.splice(a,1);
    }
    result.sort().reverse();
    return result;
  }}

async function getRptlist(parent, args, context) {
  if (chkUserId(context)){
    let subpath = path.join(
      __dirname,
      DOCXTEMP_PATH
    );
    let result = await fsPromises.readdir(subpath);
    if(args.caltypecode){
      let argStr = args.caltypecode.trim();
      result = result.filter((x) => x.indexOf(argStr) > -1);
    }
    result.sort().reverse();
    return result;
}}

function floatify(number) {
  return parseFloat(number.toFixed(13));
}

async function buildReport01(parent, args, context){
  if (chkUserId(context)){
    let parms = JSON.parse(args.parm);
    // console.log(args);
    // Load the docx file as binary content
    const content = fs.readFileSync(
      path.join(__dirname,
        DOCXTEMP_PATH, args.report_sample),
      "binary"
    );
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
    doc.render(parms);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      // compression: DEFLATE adds a compression step.
      // For a 50MB output document, expect 500ms additional CPU time
      compression: "DEFLATE",
    });

    // buf is a nodejs Buffer, you can either write it to a
    // file or res.send it with express for example.
    fs.writeFileSync(path.join(__dirname,CASE_PATH+ parms.nowCaseID, parms.nowCaseID+".docx"), buf);
    
    return parms.nowCaseID + ".docx";
}}

async function getUcModule(parent, args, context) {
  if (chkUserId(context)){
    let filepathname = path.join(
      __dirname,
      UC_PATH, args.filename
    );

    let result = fsPromises.readFile(filepathname)
      .then(function(ucData) {
        return JSON.stringify(JSON.parse(ucData));
      })
      .catch(function(error) {
        console.log(error);
      })

    return result;  
}}

async function saveUcModule(parent, args, context) {
  if (chkUserId(context)){
    let filepathname = path.join(
      __dirname,
      UC_PATH, args.filename
    );


    let result = await fsPromises.writeFile( filepathname, args.ucModuleStr)
      .then(function() {
        return args.filename;
      })
      .catch(function(error) {
        console.log(error);
      })

    return result;  
}}

async function downLoadFromAPI(parent, args, context) {
  if (chkUserId(context)){
    // 檢查資料夾是否存在，否則建立
    const subpath = path.join(
      __dirname,
      PUBLIC_PATH,
      args.toSubPath
    );

    const upfilename = args.toFileName;

    const fileresult = await fsPromises.mkdir(
      subpath,
      {recursive: true,},
      (err) => {if (err) {console.log("error occurred in creating new directory", err);
          return;
    }});

    https.get(args.fromURL, (res)=>{
      const writeStream = fs.createWriteStream(path.join(subpath, upfilename));

      writeStream.on("finish", function() {
        writeStream.close();
        // console.log("下載成功");
        return "OK";
      });
      
      res.pipe(writeStream);
      
    }).on('error', (e) => {
      console.error(e);
    });
}}


function tsRepeatUcH(pUx, pFr){

  let P35 = parseFloat(pUx[0]); // 重複測距誤差(mm)
  let T35 = parseFloat(pUx[1]); // 重複測角誤差(秒)
  let T34 = parseFloat(pUx[2]); // 重複垂直角誤差(秒)
  let P36 = parseFloat(pUx[3]); // 追溯測距_加常(mm)
  let R36 = parseFloat(pUx[4]); // 追溯測距_乘常(mm)
  let T36 = parseFloat(pUx[5]); // 追溯距離(km)
  let V36 = parseFloat(pUx[6]); // 追溯測距_涵蓋因子
  let P37 = parseFloat(pUx[7]); // 追溯測角_不確定度
  let R37 = parseFloat(pUx[8]); // 追溯測角_涵蓋因子
  let P38 = parseFloat(pUx[9]); // 測距最小刻度(mm)
  let P39 = parseFloat(pUx[10]); // 測角最小刻度(秒)
  let R40 = parseFloat(pUx[11]); // 測角假設值(度)

  let Z36 = (P36+R36*(10**-6)*T36)/V36;
  let Z37 = P37/R37;
  let Z38 = P38/3**0.5;
  let Z39 = P39/3**0.5;

  let N40 = (P35**2+Z36**2+Z38**2)**0.5;
  let N41 = (T35**2+Z37**2+Z39**2)**0.5;
  let N42 = (T34**2+Z37**2+Z39**2)**0.5;

  let T40 = Math.sin(R40/180*Math.PI);
  let T41 = Math.cos(R40/180*Math.PI);
  let R41 = 206265.0;

  let N43_2 = ((T40*T40*N40)**2+(T36*(10**6)*T41*T40)**2*(N42/R41)**2+(T36*(10**6)*T41*T40)**2*(N41/R41)**2);
  let N44_2 = ((T40*T41*N40)**2+(T36*(10**6)*T41*T41*N42/R41)**2+(-T36*(10**6)*T40*T40*N41/R41)**2);

  let D35 = (N43_2+N44_2)**0.5;
  let E35;
  if(pFr){
    
    let R35 = parseFloat(pFr[0]);// 重複測距自由度
    let V35 = parseFloat(pFr[1]);// 重複測角自由度
    let V34 = parseFloat(pFr[2]);// 重複垂直角自由度

    let X36 = parseFloat(pFr[3]);// 追溯測距自由度
    let X37 = parseFloat(pFr[4]);// 追溯測角自由度
    let X38 = 0.5*(parseFloat(pFr[5])/100)**-2;// 測距刻度自由度(相對不確定性)
    let X39 = 0.5*(parseFloat(pFr[6])/100)**-2;// 測角刻度自由度(相對不確定性)

    let P40 = N40**4/(P35**4/R35+Z36**4/X36+Z38**4/X38);
    let P41 = N41**4/(T35**4/V35+Z37**4/X37+Z39**4/X39);
    let P42 = N42**4/(T34**4/V34+Z37**4/X37+Z39**4/X39);

    let P43 = N43_2**2/(((T40*T41*N40)**4/P40)+((T36*(10**6)*T40*T41*N42/R41)**4/P42)+((T36*(10**6)*T40*T41*N41/R41)**4/P41));
    let P44 = N44_2**2/(((T40*T41*N40)**4/P40)+((T36*(10**6)*T41*T41*N42/R41)**4/P42)+((-T36*(10**6)*T40*T40*N41/R41)**4/P41));

    E35 = D35**4/(N43_2**2/P43+N44_2**2/P44)
  }
  
  return [D35,E35];
}

function tsRepeatUcV(pUx, pFr){

  let P35 = parseFloat(pUx[0]); // 重複測距誤差(mm)//
  let T34 = parseFloat(pUx[1]); // 重複垂直角誤差(秒)//
  let P36 = parseFloat(pUx[2]); // 追溯測距_加常(mm)//
  let R36 = parseFloat(pUx[3]); // 追溯測距_乘常(mm)//
  let T36 = parseFloat(pUx[4]); // 追溯距離(km)//
  let V36 = parseFloat(pUx[5]); // 追溯測距_涵蓋因子//
  let P37 = parseFloat(pUx[6]); // 追溯測角_不確定度//
  let R37 = parseFloat(pUx[7]); // 追溯測角_涵蓋因子//
  let P38 = parseFloat(pUx[8]); // 測距最小刻度(mm)//
  let P39 = parseFloat(pUx[9]); // 測角最小刻度(秒)//
  let R40 = parseFloat(pUx[10]); // 測角假設值(度)//

  let Z36 = (P36+R36*(10**-6)*T36)/V36;
  let Z37 = P37/R37;
  let Z38 = P38/3**0.5;
  let Z39 = P39/3**0.5;

  let N40 = (P35**2+Z36**2+Z38**2)**0.5;
  let N42 = (T34**2+Z37**2+Z39**2)**0.5;

  let T40 = Math.sin(R40/180*Math.PI);
  let T41 = Math.cos(R40/180*Math.PI);
  let R41 = 206265.0;

  let N78 =((T41*N40)**2+(-T36*(10**6)*T40*N42/R41)**2)**0.5;
  let P78;
  if(pFr){
    
    let R35 = parseFloat(pFr[0]);// 重複測距自由度
    let V34 = parseFloat(pFr[1]);// 重複垂直角自由度
    let X36 = parseFloat(pFr[2]);// 追溯測距自由度
    let X37 = parseFloat(pFr[3]);// 追溯測角自由度
    let X38 = 0.5*(parseFloat(pFr[4])/100)**-2;// 測距刻度自由度(相對不確定性)
    let X39 = 0.5*(parseFloat(pFr[5])/100)**-2;// 測角刻度自由度(相對不確定性)

    let P40 = N40**4/(P35**4/R35+Z36**4/X36+Z38**4/X38);
    let P42 = N42**4/(T34**4/V34+Z37**4/X37+Z39**4/X39);

    P78 =N78**4/((T41*N40)**4/P40+(-T36*(10**6)*T40*N42/R41)**4/P42);
  }
  
  return [N78,P78];
}

function lsMeasUcH(pUx, pFr){
  let R41 = 206265.0;
  let P46 = parseFloat(pUx[0]);// Boresight-angle不確定度(秒)
  let P48 = parseFloat(pUx[1]);// POS測角解析度(秒)
  let N48 = parseFloat(pUx[2]);// POS規格Phi精度(秒)
  let N49 = parseFloat(pUx[3]);// POS規格Omega精度(秒)
  let N50 = parseFloat(pUx[4]);// POS規格Kappa精度(秒)

  let N52 = parseFloat(pUx[5]);// 飛行離地高(m)
  let P52 = parseFloat(pUx[6]);// 最大掃描角(度)FOV
  let N53 = parseFloat(pUx[7]);// LiDAR規格測距精度(mm)
  let N54 = parseFloat(pUx[8]);// LiDAR規格雷射擴散角(秒)
  let N55 = parseFloat(pUx[9]);// LiDAR規格掃描角解析度(秒)

  let R52 = Math.sin(P52 / 2 / 180 * Math.PI);
  let T52 = Math.cos(P52 / 2 / 180 * Math.PI); 

  let V48 = (N48**2+P48**2+P46**2)**0.5;
  let V49 = (N49**2+P48**2+P46**2)**0.5;
  let V50 = (N50**2+P48**2+P46**2)**0.5;
  let V54 = ((N54/2)**2+(N55/(3**0.5))**2)**0.5;

  let C58 = V50/R41*1000;
  let C59 = V48/R41*1000;
  let C60 = V49/R41*1000;
  let C61 = N53/1000;
  let C62 = V54/R41*1000;

  let D58 = N52*R52;
  let D59 =-N52*T52;
  let D60 = 0.0;
  let D61 = 0.0;
  let D62 = 0.0;

  let G58 = 0.0;
  let G59 = 0.0;
  let G60 = N52*T52;
  let G61 = R52;
  let G62 = N52*T52;

  let E58 = C58**2*D58**2;
  let E59 = C59**2*D59**2;
  let E60 = C60**2*D60**2;
  let E61 = C61**2*D61**2;
  let E62 = C62**2*D62**2;

  let H58 = C58**2*G58**2;
  let H59 = C59**2*G59**2;
  let H60 = C60**2*G60**2;
  let H61 = C61**2*G61**2;
  let H62 = C62**2*G62**2;

  let E63 = (E58+E59+E60+E61+E62)**0.5;
  let H63 = (H58+H59+H60+H61+H62)**0.5;

  let E65 = (E63**2+H63**2)**0.5;
  let F65;
  if(pFr){
    let T48 = parseFloat(pFr[0]);// 姿態角相對不確定性
    let P54 = parseFloat(pFr[1]);// 擴散角相對不確定性
    let P55 = parseFloat(pFr[2]);// 掃描角相對不確定性

    let J58 = 0.5*(T48/100)**-2;
    let J61 = 0.5*(P54/100)**-2;
    let J62 = 0.5*(P55/100)**-2;

    let F58 = (D58**4*C58**4)/J58;
    let F59 = (D59**4*C59**4)/J58;
    let F60 = (D60**4*C60**4)/J58;
    let F61 = (D61**4*C61**4)/J61;
    let F62 = (D62**4*C62**4)/J62;

    let I58 = (G58**4*C58**4)/J58;
    let I59 = (G59**4*C59**4)/J58;
    let I60 = (G60**4*C60**4)/J58;
    let I61 = (G61**4*C61**4)/J61;
    let I62 = (G62**4*C62**4)/J62;

    let F64 = E63**4/(F58+F59+F60+F61+F62);
    let I64 = H63**4/(I58+I59+I60+I61+I62);

    F65 = E65**4/((E63**4/F64)+(H63**4/I64)) ;
  }
  
  return [E65,F65];
}

function lsMeasUcV(pUx, pFr){
  let R41 = 206265.0;
  let P46 = parseFloat(pUx[0]);// Boresight-angle不確定度(秒)
  let P48 = parseFloat(pUx[1]);// POS測角解析度(秒)
  let N48 = parseFloat(pUx[2]);// POS規格Phi精度(秒)
  let N49 = parseFloat(pUx[3]);// POS規格Omega精度(秒)
  let N50 = parseFloat(pUx[4]);// POS規格Kappa精度(秒)

  let N52 = parseFloat(pUx[5]);// 飛行離地高(m)
  let P52 = parseFloat(pUx[6]);// 最大掃描角(度)FOV
  let N53 = parseFloat(pUx[7]);// LiDAR規格測距精度(mm)
  let N54 = parseFloat(pUx[8]);// LiDAR規格雷射擴散角(秒)
  let N55 = parseFloat(pUx[9]);// LiDAR規格掃描角解析度(秒)

  let R52 = Math.sin(P52 / 2 / 180 * Math.PI);
  let T52 = Math.cos(P52 / 2 / 180 * Math.PI); 

  let V48 = (N48**2+P48**2+P46**2)**0.5;
  let V49 = (N49**2+P48**2+P46**2)**0.5;
  let V50 = (N50**2+P48**2+P46**2)**0.5;
  let V54 = ((N54/2)**2+(N55/(3**0.5))**2)**0.5;

  let C58 = V50/R41*1000;
  let C59 = V48/R41*1000;
  let C60 = V49/R41*1000;
  let C61 = N53/1000;
  let C62 = V54/R41*1000;

  let D110 = 0.0;
  let D111 = 0.0;
  let D112 = -N52*R52;
  let D113 = T52;
  let D114 = -N52*R52;

  let E110 = C58**2*D110**2;
  let E111 = C59**2*D111**2;
  let E112 = C60**2*D112**2;
  let E113 = C61**2*D113**2;
  let E114 = C62**2*D114**2;

  let E115 = (E110+E111+E112+E113+E114)**0.5
  let F116;
  if(pFr){
    let T48 = parseFloat(pFr[0]);// 姿態角相對不確定性
    let P54 = parseFloat(pFr[1]);// 擴散角相對不確定性
    let P55 = parseFloat(pFr[2]);// 掃描角相對不確定性

    let J58 = 0.5*(T48/100)**-2;
    let J61 = 0.5*(P54/100)**-2;
    let J62 = 0.5*(P55/100)**-2;

    let F110 =(D110**4*C58**4)/J58;
    let F111 =(D111**4*C59**4)/J58;
    let F112 =(D112**4*C60**4)/J58;
    let F113 =(D113**4*C61**4)/J61;
    let F114 =(D114**4*C62**4)/J62;

    F116 = E115**4/(F110+F111+F112+F113+F114);
  }
  
  return [E115,F116];
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseByOpr(parent, args, context) {
  if (chkUserId(context)){
    const calNum = args.calNum;
    let result=[];
    const SDate = new Date(args.year + '-01-01' );
    const EDate = new Date(args.year + '-12-31' );
    const dateFilter = {
      OR:[
        {case_record_01:{ complete_date:{ gte: SDate, lte: EDate }}},
        {case_record_02:{ complete_date:{ gte: SDate, lte: EDate }}},
      ]
    };

    const getEmpList = await context.prisma.employee.findMany({
      where:{
        employee_empower:{
          some:{
            role_type: '校正人員',
            cal_type: {in:[1,2,3]},
            OR:[
              {empower_date:{lte: EDate}},
            ]
          }
        },
        OR:[
          {resignation_date:{gte: SDate}},
          {resignation_date:{equals:null}},
        ]
      },
      select:{
        person_id:true,
        name:true,
      }
    })
    // return getEmpList;

    for(let i=0; i<getEmpList.length; i++){
      const getCaseList_o = await context.prisma.case_base.groupBy({
        where:{
          ...dateFilter, 
          operators_id: getEmpList[i].person_id,
          cus: { isNot: {org_id: 5 }},
        },
        by:['cal_type'],
        _count:{
          id:true
        }
      });

      const getCaseList_i = await context.prisma.case_base.groupBy({
        where:{
          ...dateFilter, 
          operators_id: getEmpList[i].person_id,
          cus: { is: {org_id: 5 }},
        },
        by:['cal_type'],
        _count:{
          id:true
        }
      });


      let dataObj = {};
      let total_o = 0;
      let total_i = 0;
      for(let j=1; j<(calNum+1);j++){
        let temp_o = getCaseList_o.find(x => x.cal_type===j);
        dataObj['c'+j + '_o'] = (temp_o)?temp_o._count.id:0;
        total_o = total_o + dataObj['c'+j + '_o'];

        let temp_i = getCaseList_i.find(x => x.cal_type===j);
        dataObj['c'+j + '_i'] = (temp_i)?temp_i._count.id:0;
        total_i = total_i + dataObj['c'+j + '_i'];
      }
      dataObj.total_o = total_o;
      dataObj.total_i = total_i;
      dataObj.total = total_i+total_o;
      result.push({
        name: getEmpList[i].name,
        data: dataObj,
      })
    }
    return result
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseMinMaxYear(parent, args, context) {
  if (chkUserId(context)){
    const minMaxCaseY = await context.prisma.case_base.aggregate({
      _min:{
        app_date:true
      },
      _max:{
        app_date:true
      }
    });
    const minMaxR1 = await context.prisma.case_record_01.aggregate({
      _min:{
        complete_date:true
      },
      _max:{
        complete_date:true
      }
    });
    const minMaxR2 = await context.prisma.case_record_02.aggregate({
      _min:{
        complete_date:true
      },
      _max:{
        complete_date:true
      }
    })
    const minYear = Math.min(minMaxCaseY._min.app_date.getFullYear(),minMaxR1._min.complete_date.getFullYear(),minMaxR2._min.complete_date.getFullYear());
    const maxYear = Math.max(minMaxCaseY._max.app_date.getFullYear(),minMaxR1._max.complete_date.getFullYear(),minMaxR2._max.complete_date.getFullYear(),new Date().getFullYear());

    let result = [];
    for(let i=minYear;i<(maxYear+1);i++){
      result.push(i-1911);
    }
    return result.reverse()
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseByMounth(parent, args, context) {
  if (chkUserId(context)){
    const calNum = args.calNum;
    let result=[];
    let dataObj = [];
    for(let m=0;m<12;m++){
      dataObj[m]={};
      dataObj[m].id = (m + 1) +'';
      dataObj[m].totali=0;
      dataObj[m].totalo=0;
      dataObj[m].Stotali=0;
      dataObj[m].Stotalo=0;
      dataObj[m].money=0;
      dataObj[m].Smoney=0;
      for(let cy=1;cy<4;cy++){
        dataObj[m]['m' + cy]=0;
      }
    }
    
    const SDate = new Date(args.year + '-01-01' );
    const EDate = new Date(args.year + '-12-31' );
    let dateFilter;
    let getCaseList

    switch (args.method){
      case 'app_date': //申請日
        dateFilter = {app_date:{ gte: SDate, lte: EDate }}; 
        getCaseList = await context.prisma.case_base.findMany({
          where: dateFilter,
          include:{
            cus:{ select: { org_id: true } }
          }
        });
        break;
      case 'receive_date': //送件日
        dateFilter = {
          OR:[
            {case_record_01:{ receive_date:{ gte: SDate, lte: EDate }}},
            {case_record_02:{ receive_date:{ gte: SDate, lte: EDate }}},
          ]
        };  
        getCaseList = await context.prisma.case_base.findMany({
          where: dateFilter,
          include:{
            case_record_01:{select: { receive_date: true }},
            case_record_02:{select: { receive_date: true }},
            cus:{ select: { org_id: true } }
          }
        });
        break;
      case 'complete_date': //完成日
        dateFilter = {
          OR:[
            {case_record_01:{ complete_date:{ gte: SDate, lte: EDate }}},
            {case_record_02:{ complete_date:{ gte: SDate, lte: EDate }}},
          ]
        };  
        getCaseList = await context.prisma.case_base.findMany({
          where: dateFilter,
          include:{
            case_record_01:{select: { complete_date: true }},
            case_record_02:{select: { complete_date: true }},
            cus:{ select: { org_id: true } }
          }
        });
        break;
      case 'pay_date': //繳費日
        dateFilter = {pay_date:{ gte: SDate, lte: EDate }}; 
        getCaseList = await context.prisma.case_base.findMany({
          where: dateFilter,
          include:{
            cus:{ select: { org_id: true } }
          }
        });
        break;
    }
    
    // return getCaseList 
    for(let i=0; i<getCaseList.length; i++){
      let mth;
      switch (args.method){
        case 'app_date': //申請日
          mth = getCaseList[i].app_date.getMonth();
          break;
        case 'receive_date': //送件日
          if(getCaseList[i].case_record_01){
            mth = getCaseList[i].case_record_01.receive_date.getMonth();
          }else if(getCaseList[i].case_record_02){
            mth = getCaseList[i].case_record_02.receive_date.getMonth();
          }
          break;
        case 'complete_date': //完成日
          if(getCaseList[i].case_record_01){
            mth = getCaseList[i].case_record_01.complete_date.getMonth();
          }else if(getCaseList[i].case_record_02){
            mth = getCaseList[i].case_record_02.complete_date.getMonth();
          }
          break;
        case 'pay_date': //繳費日
          mth = getCaseList[i].pay_date.getMonth();
          break;
      }

      let ctype = getCaseList[i].cal_type
      let inout;
      if(getCaseList[i].status_code!==7){
        inout='x'
      }else{
        inout = (getCaseList[i].cus.org_id===5)?'i':'o';
      }

      dataObj[mth]['c'+ctype+inout]=(dataObj[mth]['c'+ctype+inout])?dataObj[mth]['c'+ctype+inout]+1:1;
      dataObj[mth]['total'+inout]=(dataObj[mth]['total'+inout])?dataObj[mth]['total'+inout]+1:1;
      
      if(getCaseList[i].pay_date){
        if(getCaseList[i].pay_date.getFullYear()===args.year){
          let pmth = getCaseList[i].pay_date.getMonth();
          dataObj[pmth]['m' + ctype]=(dataObj[pmth]['m' + ctype])?dataObj[pmth]['m' + ctype]+getCaseList[i].charge:getCaseList[i].charge;
          dataObj[pmth].money = (dataObj[pmth].money)?dataObj[pmth].money+getCaseList[i].charge:getCaseList[i].charge;
        }
      }
      

    }
    for(let i=0;i<12;i++){
      if(i>0){
        dataObj[i].Stotali = dataObj[i-1].Stotali + dataObj[i].totali;
        dataObj[i].Stotalo = dataObj[i-1].Stotalo + dataObj[i].totalo;
        dataObj[i].Smoney = dataObj[i-1].Smoney + dataObj[i].money;
      }else{
        dataObj[i].Stotali = dataObj[i].totali;
        dataObj[i].Stotalo = dataObj[i].totalo;
        dataObj[i].Smoney = dataObj[i].money;
      }
    }

    result = dataObj;
    return result
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseTypeByYear(parent, args, context) {
  if (chkUserId(context)){
    const calNum = args.calNum;
    let result=[];
    const SDate = new Date(args.year + '-01-01' );
    const EDate = new Date(args.year + '-12-31' );
    const dateFilter_i = { 
      app_date:{ gte: SDate, lte: EDate },
      cus: { is: { org_id:5 } }
    };
    const dateFilter_o = { 
      app_date:{ gte: SDate, lte: EDate },
      cus: { isNot: { org_id:5 } }
    };

    const getList_i = await context.prisma.case_base.groupBy({
      where: dateFilter_i,
      by:['cal_type'],
      _count:{
        id:true
      }
    })

    const getList_o = await context.prisma.case_base.groupBy({
      where: dateFilter_o,
      by:['cal_type'],
      _count:{
        id:true
      }
    })

    for(let i=0;i<calNum;i++){
      let j=i+1;
      let count_i = getList_i[getList_i.findIndex(x=>x.cal_type===j)]
      let count_o = getList_o[getList_o.findIndex(x=>x.cal_type===j)]

      result[i]={
        type: j,
        count_i: (count_i)?count_i._count.id:0,
        count_o: (count_o)?count_o._count.id:0,
      }
    }
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseStatusByYear(parent, args, context) {
  if (chkUserId(context)){
    let result=[];
    const SDate = new Date(args.year + '-01-01' );
    const EDate = new Date(args.year + '-12-31' );
    const dateFilter = { app_date:{ gte: SDate, lte: EDate } };


    const getList = await context.prisma.case_base.groupBy({
      where: dateFilter,
      by:['status_code'],
      _count:{
        id:true
      }
    })

    for(let i=0;i<9;i++){
      let j=i+1
      let count = getList[getList.findIndex(x=>x.status_code===j)];
      result[i]=(count)?count._count.id:0
    }
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function statCaseTableByMounth(parent, args, context) {
  if (chkUserId(context)){
    let result={
      Fl:[0,0,0,0,0,0], Fm:[0,0,0,0,0,0], Ic:[0,0,0,0,0,0], Jc:[0,0,0,0,0,0], money:[0,0,0]
    };
    // 0~2:總計 3~5:內校
    const SDate = new Date(args.year + '-01-01' );
    const EDate = new Date(args.year + '-12-31' );
    const dateFilter = {
      OR:[
        {case_record_01:{ receive_date:{ gte: SDate, lte: EDate }}},
        {case_record_02:{ receive_date:{ gte: SDate, lte: EDate }}},
      ]
    };  
    const getCaseList = await context.prisma.case_base.findMany({
      where: dateFilter,
      include:{
        case_record_01:{select: { 
          cam_type: true,
          receive_date: true,
        }},
        case_record_02:{select: { receive_date: true }},
        cus:{ select: { org_id: true } }
      }
    });
    // console.log('total:', getCaseList.length);
    for(let i=0;i<getCaseList.length;i++){
      let mth;
      let cal_type = getCaseList[i].cal_type; //校正項目
      let cam_type;
      // console.log('=========');
      // console.log('ID:', getCaseList[i].id);
      // console.log('cal_type:', cal_type);
      if(getCaseList[i].case_record_01){
        mth = getCaseList[i].case_record_01.receive_date.getMonth() + 1;
        // console.log('record_01:', getCaseList[i].case_record_01);
        cam_type = (getCaseList[i].case_record_01)?getCaseList[i].case_record_01.cam_type:null; //大中類型
        // console.log('cam_type:', cam_type);
      }else if(getCaseList[i].case_record_02){
        mth = getCaseList[i].case_record_02.receive_date.getMonth() + 1;
        cam_type = null;
      }
      // console.log('=========');
      if(cal_type===1 && cam_type===1){
        // 大像幅
        if(mth<args.mounth){
          result.Fl[1]=result.Fl[1]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Fl[4]=result.Fl[4]+1;
            }
          }
        }else if(mth===args.mounth){
          result.Fl[2]=result.Fl[2]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Fl[5]=result.Fl[5]+1;
            }
          }
        }
      }else if(cal_type===1 && cam_type===2){
        // 中像幅
        if(mth<args.mounth){
          result.Fm[1]=result.Fm[1]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Fm[4]=result.Fm[4]+1;
            }
          }
        }else if(mth===args.mounth){
          result.Fm[2]=result.Fm[2]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Fm[5]=result.Fm[5]+1;
            }
          }
        }
      }else if(cal_type===2){
        // 空仔光達
        if(mth<args.mounth){
          result.Ic[1]=result.Ic[1]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Ic[4]=result.Ic[4]+1;
            }
          }
        }else if(mth===args.mounth){
          result.Ic[2]=result.Ic[2]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Ic[5]=result.Ic[5]+1;
            }
          }
        }
      }else if(cal_type===3){
        // 小像幅
        if(mth<args.mounth){
          result.Jc[1]=result.Jc[1]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Jc[4]=result.Jc[4]+1;
            }
          }
        }else if(mth===args.mounth){
          result.Jc[2]=result.Jc[2]+1;
          if(getCaseList[i].cus){
            if(getCaseList[i].cus.org_id===5){
              result.Jc[5]=result.Jc[5]+1;
            }
          }
        }
      }
    }
    result.Fl[0]=result.Fl[1]+result.Fl[2];
    result.Fm[0]=result.Fm[1]+result.Fm[2];
    result.Ic[0]=result.Ic[1]+result.Ic[2];
    result.Jc[0]=result.Jc[1]+result.Jc[2];

    result.Fl[3]=result.Fl[4]+result.Fl[5];
    result.Fm[3]=result.Fm[4]+result.Fm[5];
    result.Ic[3]=result.Ic[4]+result.Ic[5];
    result.Jc[3]=result.Jc[4]+result.Jc[5];

    const paydateFilter = {pay_date:{ gte: SDate, lte: EDate }}; 
    const getCasepayList = await context.prisma.case_base.findMany({
      where: paydateFilter,
      include:{
        cus:{ select: { org_id: true } }
      }
    });
    for(let j=0;j<getCasepayList.length;j++){
      let mth = getCasepayList[j].pay_date.getMonth() + 1;
      if(mth<args.mounth){
        result.money[1]=result.money[1]+getCasepayList[j].charge;
      }else if(mth===args.mounth){
        result.money[2]=result.money[2]+getCasepayList[j].charge;
      }
    }
    result.money[0]=result.money[1]+result.money[2];
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function allusers(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.user.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getUserById(parent, args, context) {
  if (chkUserId(context)){
  const where = { user_id: args.user_id };

  const result = await context.prisma.user.findUnique({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getUserByName(parent, args, context) {
  if (chkUserId(context)){
    if (args.user_name){
      const where = { user_name: args.user_name }; 
      const result = await context.prisma.user.findUnique({
        where,
      });

      return result;
    }else{
      return null;
    }
    
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDoc(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.doc.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDocLatest(parent, args, context) {
  if (chkUserId(context)){
  let filter = [];
  for (let key in args) {
    // if (args[key]) {
      let myObj = new Object();
      switch (key) {
        case "stauts":
          let nowStauts = args.stauts;
          console.log('stauts',nowStauts);
          if(nowStauts){
            // true => 顯示廢止文件
          }else{
            // false => 不顯示廢止文件
            filter.push({ expiration_date: null });
          }
          break;
        case "doc_id":
        case "name":
        case "ver":
          myObj[key] = { contains: args[key] };
          filter.push(myObj);
          break;
        default:
          myObj[key] = args[key];
          filter.push(myObj);
      }
    // }
  }
  const where = { AND: filter };
  // const result = await context.prisma.doc_latest.findMany({
  //   where,
  // });
  // 保留最新紀錄之查詢法：
  // 1.利用查詢不重複指令(distinct)
  // 2.配合遞減排序發布時間(release_date: 'desc')，即保留最新紀錄在前面
  const result = await context.prisma.doc.findMany({
    where: where,
    distinct: ['doc_id'],
    orderBy: {
      release_date: 'desc',
    },
  })
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocHistory(parent, args, context) {
  if (chkUserId(context)){
  const where = { doc_id: args.doc_id };

  const result = await context.prisma.doc.findMany({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocChild(parent, args, context) {
  if (chkUserId(context)){
  const where = { 
    parent_id: {
      contains: args.doc_id
    }
  };

  // const result = await context.prisma.doc_latest.findMany({
  //   where,
  // });
  const result = await context.prisma.doc.findMany({
    where: where,
    distinct: ['doc_id'],
    orderBy: {
      release_date: 'desc',
    },
  })

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocbyID(parent, args, context) {
  if (chkUserId(context)){
  const where = { id: args.id };

  const result = await context.prisma.doc.findUnique({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDocType(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.doc_type.findMany();
  }
}





/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllPrj(parent, args, context) {
  if (chkUserId(context)) {
    let filter = [];
    for (let key in args) {
      if (args[key]) {
        let myObj = new Object();
        switch (key) {
          // ---------------------
          case "pubdate_start":
            if (args["pubdate_end"]) {
              // with start and end
              myObj["publish_date"] = {
                gte: args[key],
                lte: args["pubdate_end"],
              };
            } else {
              // only has start
              myObj["publish_date"] = {
                gte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "pubdate_end":
            if (args["pubdate_start"]) {
              // 前面已經有處理
            } else {
              // only has end
              myObj["publish_date"] = {
                lte: args[key],
              };
            }
            filter.push(myObj);
            break;
          case "project_code":
            myObj[key] = { contains: args[key] };
            filter.push(myObj);
            break;
          default:
            myObj[key] = args[key];
            filter.push(myObj);
        }
      }
    }
    const where = { AND: filter };
    const result = await context.prisma.ref_project.findMany({
      where,
    });

    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getPrjById(parent, args, context) {
  if (chkUserId(context)){
    if (args.id){
      return await context.prisma.ref_project.findUnique({
        where: { id: args.id },
      });
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordsByPrj(parent, args, context) {
  if (chkUserId(context)){
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        switch (key) {
          case "project_id":
          case "status":
            filter[key] = args[key];
            break;
          case "cal_type_id": //1:大像幅;2:中像幅;3:小像幅;4:光達
            if (args.cal_type_id === 1) {
              filter["gcp"] = {
                is: { OR: [{ type_code: 5 }, { type_code: 35 }] },
              };
            } else if (args.cal_type_id === 2 || args.cal_type_id === 3) {
              filter["gcp"] = {
                is: { OR: [{ type_code: 7 }, { type_code: 35 }] },
              };
            } else if (args.cal_type_id === 4) {
              filter["gcp"] = {
                is: { type_code: 13 },
              };
            }
            break;
        }
      }
    }
    return await context.prisma.gcp_record.findMany({
      where: filter,
      },
    );
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
 async function getAllEqpt(parent, args, context) {
  if (chkUserId(context)){
    let filter = {};
    for (let key in args) {
      if (args[key]) {
        filter[key] = args[key];
      }
    }
    return await context.prisma.ref_eqpt.findMany({
      where: filter,
      },
    );
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptType(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_eqpt_type.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpType(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_type.findMany();}
}



/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllContact(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_contact.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getContactById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_contact.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGCPsByContact(parent, args, context) {
  if (chkUserId(context)){
    return await context.prisma.gcp.findMany({
      where: { contact_id: args.id },
    });
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCtlChartData(parent, args, context) {
  if (chkUserId(context)){
    let result = await context.prisma.ctlchart.findMany({
      where: { 
        prj_id: args.prj_id,
        cal_code: args.cal_code,
      },
    });
    result.forEach(x=>{
      x.hasdata = (x.data)?true:false;
    })
    return result;
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function computeCtlChart(parent, args, context) {
  let nowPrjPt;
  let chartData=[];
  if (chkUserId(context)){
    // console.log('args',args);
    // 查詢目前作業基本資料是否為量測型
    const nowPrjBase = await context.prisma.ref_project.findMany({
      where: { 
        project_code: args.prj_id,
        OR: [{method: '量測'}, {method: '中間查核'}],
      },
    });
    // console.log('nowPrjBase',nowPrjBase);
    if(nowPrjBase.length===0){ return null }

    // 本次作業資料
    const nowPrjData = await context.prisma.ctlchart.findMany({
      where: { 
        prj_id: args.prj_id,
        cal_code: args.cal_code,
      },
    });
    // console.log('nowPrjData:',nowPrjData[0]);
    // console.log('建立基線全組合開始==============');
    // console.log('先取得目前作業全部點號及坐標值');
    // 點位類型：2:網形控制點; 5:大校正場; 7:小校正場; 35:大小共用; 13:光達物; 
    switch (args.cal_code){
      case 'F':
        nowPrjPt = await context.prisma.gcp_record.findMany({              
          where: {
            status: '正常',
            ref_project: {
              is: {project_code: args.prj_id}
            },
            gcp: {
              is: { OR: [{ type_code: 2 },{ type_code: 5 },{ type_code: 7 },{ type_code: 35 }] },
            }
          },
          include: {
            gcp: true
          }
        });
        break;
      case 'I':
        nowPrjPt = await context.prisma.gcp_record.findMany({              
          where: {
            status: '正常',
            ref_project: {
              is: {project_code: args.prj_id}
            },
            gcp: {
              is: { OR: [{ type_code: 2 },{ type_code: 13 }] },
            }
          },
          include: {
            gcp: true
          }
        });
        break;
      case 'J':
        nowPrjPt = await context.prisma.gcp_record.findMany({              
          where: {
            status: '正常',
            ref_project: {
              is: {project_code: args.prj_id}
            },
            gcp: {
              is: { OR: [{ type_code: 2 },{ type_code: 7 },{ type_code: 35 }] },
            }
          },
          include: {
            gcp: true
          }
        });
        break;
    }

    // console.log('建立基線全組合，[p1,p2,s]');
    for(let i=0;i<nowPrjPt.length;i++){
      for(let j=i+1;j<nowPrjPt.length;j++){
        let baseline = {};
        if(nowPrjPt[i].gcp.type_code!==2 || nowPrjPt[j].gcp.type_code!==2){
          baseline['p1']=nowPrjPt[i].gcp_id;
          baseline['p2']=nowPrjPt[j].gcp_id;
          baseline['s']=(((nowPrjPt[i].coor_E-nowPrjPt[j].coor_E)**2+(nowPrjPt[i].coor_N-nowPrjPt[j].coor_N)**2+(nowPrjPt[i].coor_h-nowPrjPt[j].coor_h)**2)**.5);
          chartData.push(baseline);
        }
      }
    }

    // console.log('檢查是否有前次資料');
    // 前次作業資料
    const prePrjData = await context.prisma.ctlchart.findMany({
      where: { 
        prj_id: args.prj_id_base,
        cal_code: args.cal_code,
      },
    });
    // console.log('prePrjData:',prePrjData[0]);
    let total=0;
    let count=0;
    let avg;
    let vv=0;
    let std;
    let min;
    let max;

    if(prePrjData[0] && prePrjData[0].data){
      // console.log('有前次全組合資料');
      // console.log('開始計算較差');
      let preChartData = prePrjData[0].data;
      for(let k=0;k<chartData.length;k++){
        const pickId = preChartData.findIndex(x=>{
          return x.p1===chartData[k].p1 && x.p2===chartData[k].p2
        });
        // console.log('pickId',pickId);
        // console.log('get preChartData',preChartData[pickId]);
        if(pickId===-1){
          // console.log('前次無該基線');
          // console.log('剔除該基線? or 設定ds==null');
          chartData[k].ds=null;
        }else{
          // console.log('前次有該基線');
          let ds = chartData[k].s-preChartData[pickId].s;
          chartData[k].ds=ds;
          count=count+1;
          total=total+ds;
          if(k===0){
            min=ds;
            max=ds;
          }else{
            min=(ds<min)?ds:min;
            max=(ds>max)?ds:max;
          }
        }
      }
      // console.log('計算平均和標準偏差');
      avg=total/count;
      for (let i=0;i<chartData.length;i++){
        if(chartData[i].ds!==null){
          vv=vv+(chartData[i].ds-avg)**2;
        }
      }
      std=(vv/(count-1))**.5;
    }else{
      if(nowPrjData[0]){
        avg = nowPrjData[0].ave;
        std = nowPrjData[0].std;
        min = nowPrjData[0].min;
        max = nowPrjData[0].max;
      }else{
        avg = null;
        std = null;
        min = null;
        max = null;
      }
    }

    // console.log('將全組合資料儲存到資料庫中');
    const result2 = await context.prisma.ctlchart.upsert({
      where: { 
        id:(nowPrjData[0])?(nowPrjData[0].id):-1
      },
      update:{
        prj_id_base: args.prj_id_base,
        label: (args.label)?args.label:nowPrjData[0].label,
        ave: avg,
        std: std,
        min: min,
        max: max,
        data: chartData
      },
      create:{
        prj_id: args.prj_id,
        cal_code: args.cal_code,
        prj_id_base: args.prj_id_base,
        label: (args.label)?args.label:nowPrjData[0].label,
        ave: avg,
        std: std,
        min: min,
        max: max,
        data: chartData
      }
    })

    return {
      // 'nowPrjData': nowPrjData,
      'prePrjData': prePrjData,
      'chartData': chartData,
      'result2': result2,
    }
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCtlChart(parent, args, context) {
  if (chkUserId(context)){
    const allctlchart = await context.prisma.ctlchart.findMany({
      where: { 
        cal_code: args.cal_code,
        NOT: {prj_id_base: '-1'}
      },
    });
    allctlchart.sort((a,b)=>{
      return (a.prj_id > b.prj_id)?1:-1
    })
    let result=[];
    for(let i=0;i<allctlchart.length;i++){
      if(args.stop_prj){
        if(allctlchart[i].prj_id > args.stop_prj){
          break;
        }
      }
      result.push({
        label:allctlchart[i].label,
        avg: allctlchart[i].ave,
        std: allctlchart[i].std,
        up: (allctlchart[i].ave + (allctlchart[i].std*3)).toFixed(3),
        down: (allctlchart[i].ave - (allctlchart[i].std*3)).toFixed(3),
        min: allctlchart[i].min,
        max: allctlchart[i].max,
      })
      
    }
    return result
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCChartList(parent, args, context) {
  if (chkUserId(context)){
    const allPrjList = await context.prisma.ref_project.findMany({
      where: { 
        method: '量測',
        cal_type: {
          is: {code: args.cal_code} 
        },
      }
    });
    allPrjList.sort((a,b)=>{
      return (a.project_code > b.project_code)?1:-1
    })
    let result=[];
    for(let i=0;i<allPrjList.length;i++){
      result.push(allPrjList[i].project_code)
    }
    return result
  }
}

export default {
  checktoken,
  signup,
  login,
  updateUser,
  delUser,
  chkUserByName,
  changePASSWord,
  creatDoc,
  delDoc,
  updateDoc,
  uploadDoc,
  uploadFile,
  getAllCase,
  getCasebyID,
  getCaseStatus,
  getCaseCalType,
  getAllItem,
  getItemByID,
  getAllItemType,
  getAllRecord01,
  creatCase,
  delCase,
  updateCase,
  updateRecord01,
  updateRecord02,
  updateRecord03,
  createItem,
  delItem,
  updateItem,
  createItemType,
  delItemType,
  updateItemType,
  getItemBySN,
  buildReport01,
  getAllCust,
  getCustById,
  getAllOrg,
  getOrgById,
  createCust,
  delCust,
  updateCust,
  getCustByName,
  createOrg,
  delOrg,
  updateOrg,
  getAllEmp,
  getEmpById,
  getEmpByRole,
  getEmpRoleList,
  getEmpowerbyRole,
  getEmpowerByPerson,
  getAllTrain,
  createEmp,
  delEmp,
  updateEmp,
  createEmpRole,
  delEmpRole,
  getEmpowerByID,
  createEmpower,
  delEmpower,
  updateEmpower,
  getTrainByID,
  getTrainByPerson,
  createTrain,
  delTrain,
  updateTrain,
  createRefPrj,
  delRefPrj,
  updateRefPrj,
  savePrjEqptUse,
  delPrjEqptUse,
  addPrjEqptKey,
  removePrjEqptKey,
  updatePrjEqptKey,
  createRefEqpt,
  delRefEqpt,
  getEqptByPrj,
  getEqptById,
  getEqptChopList,
  getEqptModelList,
  updateRefEqpt,
  delRefEqptType,
  updateRefEqptType,
  getChkById,
  getChkByEqptId,
  getAllChkOrgList,
  createRefEqptChk,
  delRefEqptChk,
  updateRefEqptChk,
  calRefGcp,
  getAllGcp,
  getGcpById,
  getGcpRecordById,
  getGcpRecordByPrjId,
  getAllGcpStyleList,
  getAllRecPersonList,
  getGcpRecordsByGCPId,
  createGCP,
  delGCP,
  updateGCP,
  createGcpRecord,
  inputGCPRecords,
  delGcpRecord,
  updateGcpRecord,
  createGcpType,
  delGcpType,
  updateGcpType,
  createGcpContact,
  delGcpContact,
  updateGcpContact,
  computeUc,
  getUcResultformJson,
  getUclist,
  getRptlist,
  getUcModule,
  saveUcModule,
  downLoadFromAPI,
  statCaseByOpr,
  statCaseMinMaxYear,
  statCaseByMounth,
  statCaseTypeByYear,
  statCaseStatusByYear,
  statCaseTableByMounth,
  allusers,
  getUserById,
  getUserByName,
  getAllDoc,
  getAllDocLatest,
  getDocHistory,
  getDocChild,
  getDocbyID,
  getAllDocType,
  getAllPrj,
  getPrjById,
  getGcpRecordsByPrj,
  getAllEqpt,
  getEqptType,
  getGcpType,
  getAllContact,
  getContactById,
  getGCPsByContact,
  getCtlChartData,
  computeCtlChart,
  getAllCtlChart,
  getAllCChartList,
};
