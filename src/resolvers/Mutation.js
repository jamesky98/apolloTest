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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_PATH = process.env.PUBLIC_PATH;
const DOC_PATH = process.env.DOC_PATH;
const CASE_PATH = process.env.CASE_PATH;
const UC_PATH = process.env.UC_PATH;
const DOCXTEMP_PATH = process.env.DOCXTEMP_PATH;

const PUBLIC_PATH_DEV = process.env.PUBLIC_PATH_DEV;
const DOC_PATH_DEV = process.env.DOC_PATH_DEV;
const CASE_PATH_DEV = process.env.CASE_PATH_DEV;
const UC_PATH_DEV = process.env.UC_PATH_DEV;
const DOCXTEMP_PATH_DEV = process.env.DOCXTEMP_PATH_DEV;

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
  const subpath_DEV = path.join(
    __dirname,
    DOC_PATH_DEV,
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

  const fileresult_DEV = await fsPromises.mkdir(
    subpath_DEV,
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

  const out_DEV = fs.createWriteStream(path.join(subpath_DEV, upfilename));
  stream.pipe(out_DEV);
  await finished(out_DEV);
  // console.log("upload finished!!");
  return { filename: upfilename, mimetype: mimetype, encoding: encoding };
}

async function uploadFile(parent, args, context) {
  if (!chkUserId(context)) {
    throw new Error("未經授權");
  }
  const { createReadStream, filename, mimetype, encoding } = await args.file;
  const stream = createReadStream();
  const stream_DEV = createReadStream();

  // 檢查資料夾是否存在
  const subpath = path.join(
    __dirname,
    PUBLIC_PATH,
    args.subpath
  );
  const subpath_DEV = path.join(
    __dirname,
    PUBLIC_PATH_DEV,
    args.subpath
  );

  const upfilename = args.newfilename;
  const fileresult = await fsPromises.mkdir(
    subpath,
    {recursive: true,},
    (err) => {if (err) {console.log("error occurred in creating new directory", err);
        return;
  }});
  const fileresult_DEV = await fsPromises.mkdir(
    subpath_DEV,
    {recursive: true,},
    (err) => {if (err) {console.log("error occurred in creating new directory", err);
        return;
  }});

  // console.log(fileresult);
  // 開始寫入檔案
  const out = fs.createWriteStream(path.join(subpath, upfilename));
  stream.pipe(out);
  await finished(out);

  const out_DEV = fs.createWriteStream(path.join(subpath_DEV, upfilename));
  stream_DEV.pipe(out_DEV);
  await finished(out_DEV);
  // console.log("upload finished!!");
  return { filename: upfilename, mimetype: mimetype, encoding: encoding };
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
  let tempArgs = { ...args };
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
  let tempArgs = { ...args };
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
  const result = await context.prisma.employee.delete({
    where: { person_id: args.person_id },
  });

  return result;}
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
  const result = await context.prisma.ref_project.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  const result = await context.prisma.ref_eqpt.update({
    where: { ref_equpt_id: args.ref_equpt_id },
    data: { ...tempArgs },
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
  const result = await context.prisma.ref_eqpt_check.update({
    where: { eq_ck_id: args.eq_ck_id },
    data: { ...tempArgs },
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
async function getAllRecPersonList(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.gcp_record.groupBy({
      by: ['person'],
    });
    let nameList = [];
    result.map(x=>{
      nameList.push(x.person);
    })
    return nameList.sort();
  }
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
    // dev
    fs.writeFileSync(path.join(__dirname,CASE_PATH_DEV+ parms.nowCaseID, parms.nowCaseID+".docx"), buf);
    
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
    // DEV
    let filepathname_DEV = path.join(
      __dirname,
      UC_PATH_DEV, args.filename
    );
    let result_DEV = await fsPromises.writeFile( filepathname_DEV, args.ucModuleStr)
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
    const subpath_DEV = path.join(
      __dirname,
      PUBLIC_PATH_DEV,
      args.toSubPath
    );

    const upfilename = args.toFileName;

    const fileresult = await fsPromises.mkdir(
      subpath,
      {recursive: true,},
      (err) => {if (err) {console.log("error occurred in creating new directory", err);
          return;
    }});

    const fileresult_DEV = await fsPromises.mkdir(
      subpath_DEV,
      {recursive: true,},
      (err) => {if (err) {console.log("error occurred in creating new directory", err);
          return;
    }});

    https.get(args.fromURL, (res)=>{
      const writeStream = fs.createWriteStream(path.join(subpath, upfilename));
      const writeStream_DEV = fs.createWriteStream(path.join(subpath_DEV, upfilename));

      writeStream.on("finish", function() {
        writeStream.close();
        // console.log("下載成功");
        res.pipe(writeStream_DEV);
        // return "OK";
      });
      
      writeStream_DEV.on("finish", function() {
        writeStream_DEV.close();
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
  creatCase,
  delCase,
  updateCase,
  updateRecord01,
  updateRecord02,
  createItem,
  delItem,
  updateItem,
  createItemType,
  delItemType,
  updateItemType,
  getItemBySN,
  buildReport01,
  createCust,
  delCust,
  updateCust,
  getCustByName,
  createOrg,
  delOrg,
  updateOrg,
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
  createTrain,
  delTrain,
  updateTrain,
  createRefPrj,
  delRefPrj,
  updateRefPrj,
  addPrjEqptKey,
  removePrjEqptKey,
  updatePrjEqptKey,
  createRefEqpt,
  delRefEqpt,
  updateRefEqpt,
  delRefEqptType,
  updateRefEqptType,
  createRefEqptChk,
  delRefEqptChk,
  updateRefEqptChk,
  calRefGcp,
  getAllGcp,
  getGcpById,
  getGcpRecordById,
  getAllRecPersonList,
  createGCP,
  delGCP,
  updateGCP,
  createGcpRecord,
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
};
