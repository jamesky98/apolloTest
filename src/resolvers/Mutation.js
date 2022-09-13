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
import { fileURLToPath } from "url";
import jStat from "jstat";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    "../../../vue-apollo3/public/02_DOC/",
    args.subpath
  );
  const upfilename = args.newfilename;
  fs.mkdir(
    subpath,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        console.log("error occurred in creating new directory", err);
        return;
      }
      // console.log("New directory created successfully");
    }
  );
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
    "../../../vue-apollo3/public/",
    args.subpath
  );
  const upfilename = args.newfilename;
  fs.mkdir(
    subpath,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        console.log("error occurred in creating new directory", err);
        return;
      }
      // console.log("New directory created successfully");
    }
  );
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
  const result = await context.prisma.item_base.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  const result = await context.prisma.cus.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  const result = await context.prisma.cus_org.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  const result = await context.prisma.employee.update({
    where: { person_id: args.person_id },
    data: { ...tempArgs },
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
  delete tempArgs.id;
  const result = await context.prisma.gcp.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  delete tempArgs.id;
  const result = await context.prisma.gcp_record.update({
    where: { id: args.id },
    data: { ...tempArgs },
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
  const result = await context.prisma.gcp_contact.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });
  return result;}
} 

async function computeUc(parent, args, context) {
  if (chkUserId(context)){
    let parm = JSON.parse(args.parm);
    let filepathname = path.join(
      __dirname,
      "../../../vue-apollo3/public/06_Case/uncertainty", args.uc_model
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
      "../../../vue-apollo3/public/06_Case/uncertainty", args.filename
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
      
      let calcUx = UcResult.data[i].data[j].ux ** 2 * UcResult.data[i].data[j].factor;
      let calcFr = (UcResult.data[i].data[j].ux ** 4 * UcResult.data[i].data[j].factor) / UcResult.data[i].data[j].freedom;
      if (myData[i].type === "平面") {
        ucH_s = ucH_s + calcUx;
        freeH = freeH + calcFr;
      } else if (myData[i].type === "高程") {
        ucV_s = ucV_s + calcUx;
        freeV = freeV + calcFr;
      }
      sectionUx = sectionUx + calcUx;
      sectionFr = sectionFr + calcFr;
    }

    sectionUx = sectionUx ** 0.5;
    sectionFr = sectionUx ** 4 / sectionFr;

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
  if (ucV < parseFloat(UcResult.minUcV)) {
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
  return UcResult;
}

function getDigPos(uc,signDig){
  // signDig有效位數通常取2
  let numstr = uc.toExponential().split("e");
  // 檢查位置
  let chkPos = (signDig === 1) ? 2 : (signDig+1);
  let temp = parseFloat(numstr[0]) * 10 ** (chkPos - 2);
  let truePow = parseInt(numstr[1]) + 2 - chkPos;
  let fixUc = 0.0;
  if(numstr[0].charAt(chkPos) === '0'){
    // 捨去
    fixUc = Math.trunc(temp) * (10 ** truePow);
  }else{
    // 進位
    fixUc = (Math.trunc(temp) + 1) * (10 ** truePow);
  };
  numstr = fixUc.toExponential().split("e");
  let DigPos = parseInt(numstr[1]) - signDig + 1;
  return { fixUc, DigPos };
}

async function getUclist(parent, args, context) {
  if (chkUserId(context)){
    let subpath = path.join(
      __dirname,
      "../../../vue-apollo3/public/06_Case/uncertainty"
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
      "../../../vue-apollo3/public/06_Case/docxtamplate"
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

    // Load the docx file as binary content
    const content = fs.readFileSync(
      path.join(__dirname,
        "../../../vue-apollo3/public/06_Case/docxtamplate", args.report_sample),
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
    fs.writeFileSync(path.join(__dirname,
      "../../../vue-apollo3/public/06_Case/"+ parms.nowCaseID, parms.nowCaseID+".docx"), buf);
    
    return parms.nowCaseID + ".docx";
}}

async function getUcModule(parent, args, context) {
  if (chkUserId(context)){
    let filepathname = path.join(
      __dirname,
      "../../../vue-apollo3/public/06_Case/uncertainty", args.filename
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
      "../../../vue-apollo3/public/06_Case/uncertainty", args.filename
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

function tsRepeatUcH(pra){
  // pra[0]: P35 重複測距誤差(mm)
  // pra[1]: T35 重複測角誤差(秒)
  // pra[2]: T34 重複垂直角誤差(秒)
  // pra[3]: P36 追溯測距_加常(mm)
  // pra[4]: R36 追溯測距_乘常(mm)
  // pra[5]: T36 追溯距離(km)
  // pra[6]: V36 追溯測距_涵蓋因子
  // pra[7]: P37 追溯測角_不確定度
  // pra[8]: R37 追溯測角_涵蓋因子
  // pra[9]: P38 測距最小刻度(mm)
  // pra[10]: P39 測角最小刻度(秒)
  // pra[11]: R40 測角假設值(度)
  
  let parm=pra.map(x=>{return parseFloat(x)});
  let disPtUc = (parm[3]+parm[4]*(10**-6)*parm[5])/parm[6]; // Z36
  console.log("disPtUc",disPtUc);
  let angPtUc = parm[7]/parm[8]; // Z37
  console.log("angPtUc",angPtUc);
  let disSpUc = parm[9]/3**0.5; // Z38
  console.log("disSpUc",disSpUc);
  let angSpUc = parm[10]/3**0.5; // Z39
  console.log("angSpUc",angSpUc);

  let disComUc = (parm[0]**2+disPtUc**2+disSpUc**2)**0.5; // N40
  console.log("disComUc",disComUc);
  let angComUc = (parm[1]**2+angPtUc**2+angSpUc**2)**0.5; // N41
  console.log("angComUc",angComUc);
  let vangComUc = (parm[2]**2+angPtUc**2+angSpUc**2)**0.5; // N42
  console.log("vangComUc",vangComUc);

  let T40 = Math.sin(parm[11]/180*Math.PI);
  console.log("T40",T40);
  let T41 = Math.cos(parm[11]/180*Math.PI);
  console.log("T41",T41);
  let R41 = 206265.0;

  let N43_2 = (((T40**2)**2*disComUc**2)+((parm[5]*(10**6)*T41*T40)**2)*(vangComUc/R41)**2+((parm[5]*(10**6)*T41*T40)**2)*(angComUc/R41)**2);
  console.log("N43",N43_2**0.5);
  let N44_2 = ((T40*T41*disComUc)**2+(parm[5]*(10**6)*T41*T41*vangComUc/R41)**2+(-parm[5]*(10**6)*T40*T40*angComUc/R41)**2);
  console.log("N44",N44_2**0.5);

  console.log("tsRepeatUc",(N43_2+N44_2)**0.5);
  return (N43_2+N44_2)**0.5
}

function tsRepeatFrH(pUx, pFr){
  // pra[0]: P35 重複測距誤差(mm)
  // pra[1]: T35 重複測角誤差(秒)
  // pra[2]: T34 重複垂直角誤差(秒)
  // pra[3]: P36 追溯測距_加常(mm)
  // pra[4]: R36 追溯測距_乘常(mm)
  // pra[5]: T36 追溯距離(km)
  // pra[6]: V36 追溯測距_涵蓋因子
  // pra[7]: P37 追溯測角_不確定度
  // pra[8]: R37 追溯測角_涵蓋因子
  // pra[9]: P38 測距最小刻度(mm)
  // pra[10]: P39 測角最小刻度(秒)
  // pra[11]: R40 測角假設值(度)
  
  let parm=pUx.map(x=>{return parseFloat(x)});
  let fr=pFr.map(x=>{return parseFloat(x)});
  let disPtUc = (parm[3]+parm[4]*(10**-6)*parm[5])/parm[6]; // Z36
  console.log("disPtUc",disPtUc);
  let angPtUc = parm[7]/parm[8]; // Z37
  console.log("angPtUc",angPtUc);
  let disSpUc = parm[9]/3**0.5; // Z38
  console.log("disSpUc",disSpUc);
  let angSpUc = parm[10]/3**0.5; // Z39
  console.log("angSpUc",angSpUc);

  let disComUc = (parm[0]**2+disPtUc**2+disSpUc**2)**0.5; // N40
  console.log("disComUc",disComUc);
  let angComUc = (parm[1]**2+angPtUc**2+angSpUc**2)**0.5; // N41
  console.log("angComUc",angComUc);
  let vangComUc = (parm[2]**2+angPtUc**2+angSpUc**2)**0.5; // N42
  console.log("vangComUc",vangComUc);

  let T40 = Math.sin(parm[11]/180*Math.PI);
  console.log("T40",T40);
  let T41 = Math.cos(parm[11]/180*Math.PI);
  console.log("T41",T41);
  let R41 = 206265.0;

  let N43_2 = (((T40**2)**2*disComUc**2)+((parm[5]*(10**6)*T41*T40)**2)*(vangComUc/R41)**2+((parm[5]*(10**6)*T41*T40)**2)*(angComUc/R41)**2);
  console.log("N43",N43_2**0.5);
  let N44_2 = ((T40*T41*disComUc)**2+(parm[5]*(10**6)*T41*T41*vangComUc/R41)**2+(-parm[5]*(10**6)*T40*T40*angComUc/R41)**2);
  console.log("N44",N44_2**0.5);

  console.log("tsRepeatUc",(N43_2+N44_2)**0.5);
  let ux = (N43_2+N44_2)**0.5


}

export default {
  signup,
  login,
  updateUser,
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
  buildReport01,
  createCust,
  delCust,
  updateCust,
  createOrg,
  delOrg,
  updateOrg,
  createEmp,
  delEmp,
  updateEmp,
  createEmpRole,
  delEmpRole,
  createEmpower,
  delEmpower,
  updateEmpower,
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
  createRefEqptType,
  delRefEqptType,
  updateRefEqptType,
  createRefEqptChk,
  delRefEqptChk,
  updateRefEqptChk,
  calRefGcp,
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
};
