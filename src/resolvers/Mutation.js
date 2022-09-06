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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import jStat from "jstat";


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
  let parm = JSON.parse(args.parm);
  let ucH = 0.0;
  let ucV = 0.0;
  let freeH = 0;
  let freeV = 0;
  let tinvH = 0;
  let tinvV = 0;
  let result = import(
    "../../../vue-apollo3/public/06_Case/uncertainty/" + args.uc_model
  ).then((module) => {
    let UcResult ={};
    let sectionUx = 0;
    let sectionFr = 0;
    UcResult = JSON.parse(JSON.stringify(module.ucData));
    let myData = module.ucData.data;
    // 計算不確定度
    switch (module.ucData.calType) {
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
        // 開始計算
        for (let i = 0; i < myData.length; i++) {
          // section 循環
          sectionUx = 0;
          sectionFr = 0;
          for (let j = 0; j < myData[i].data.length; j++) {
            // subitem 循環
            UcResult.data[i].data[j].ux = myData[i].data[j].ux();
            UcResult.data[i].data[j].freedom = myData[i].data[j].freedom();
            UcResult.data[i].data[j].factor = myData[i].data[j].factor();
            if (myData[i].type === "平面") {
              ucH =
                ucH + myData[i].data[j].ux() ** 2 * myData[i].data[j].factor();
              freeH =
                freeH +
                (myData[i].data[j].ux() ** 4 * myData[i].data[j].factor()) /
                  myData[i].data[j].freedom();
            } else if (myData[i].type === "高程") {
              ucV =
                ucV + myData[i].data[j].ux() ** 2 * myData[i].data[j].factor();
              freeV =
                freeV +
                (myData[i].data[j].ux() ** 4 * myData[i].data[j].factor()) /
                  myData[i].data[j].freedom();
            }
          }
          if (myData[i].type === "平面") {
            sectionUx = ucH ** 0.5;
            sectionFr = sectionUx ** 4 / freeH;
          } else if (myData[i].type === "高程") {
            sectionUx = ucV ** 0.5;
            sectionFr = sectionUx ** 4 / freeV;
          }
          UcResult.data[i].combUx = sectionUx;
          UcResult.data[i].combFr = sectionFr;
        }
        ucH = ucH ** 0.5;
        freeH = ucH ** 4 / freeH;
        tinvH = jStat.studentt
          .inv(1 - (1 - module.ucData.confLevel) / 2, freeH)
          .toFixed(2);
        ucH = floatify(tinvH * ucH);
        if (ucH < module.ucData.minUcH) {
          ucH = module.ucData.minUcH;
        }
        ucV = ucV ** 0.5;
        freeV = ucV ** 4 / freeV;
        tinvV = jStat.studentt
          .inv(1 - (1 - module.ucData.confLevel) / 2, freeV)
          .toFixed(2);
        ucV = floatify(tinvV * ucV);
        if (ucV < module.ucData.minUcV) {
          ucV = module.ucData.minUcV;
        }
        break;
      case "I":
    }
    UcResult.ucH = ucH;
    let fixresultH = getDigPos(ucH, 2);
    UcResult.digPosH = fixresultH.DigPos;
    UcResult.fixUcH = fixresultH.fixUc;
    UcResult.freeH = freeH;
    UcResult.tinvH = tinvH;
    
    UcResult.ucV = ucV;
    let fixresultV = getDigPos(ucV, 2);
    UcResult.digPosV = fixresultV.DigPos;
    UcResult.fixUcV = fixresultV.fixUc;
    UcResult.freeV = freeV;
    UcResult.tinvV = tinvV;

    UcResult.calType = module.ucData.calType;
    UcResult.prjcode = module.ucData.prjcode;
    UcResult.ver = module.ucData.ver;
    UcResult.minUcH = module.ucData.minUcH;
    UcResult.minUcV = module.ucData.minUcV;
    return UcResult;
  });
  return result;  
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

function fixDataDigPos(data, pos) {
  // 四捨五入
  return Math.round(data / 10 ** pos)*10**pos;
  ;
}

async function getUclist(parent, args, context) {
  let subpath = path.join(
    __dirname,
    "../../../vue-apollo3/public/06_Case/uncertainty"
  );
  let result = await fsPromises.readdir(subpath);
  if(args.caltypecode && args.refprjcode){
    let argStr = args.caltypecode.trim() + "_" + args.refprjcode.trim();
    result = result.filter((x) => x.indexOf(argStr) > -1);
  }
  
  return result;
}

function floatify(number) {
  return parseFloat(number.toFixed(13));
}

export default {
  signup,
  login,
  chkUserByName,
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
  getUclist,
};
