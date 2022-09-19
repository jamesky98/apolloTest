/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */

import { APP_SECRET, chkUserId } from "../utils.js";

async function checktoken(parent, args, context) {
  return chkUserId(context);;
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

async function getNowUser(parent, args, context) {
  const result = await context.prisma.user.findUnique({
    where:{ user_name: context.userId.userId },
  });
  return result;
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
    if (args[key]) {
      let myObj = new Object();
      switch (key) {
        case "stauts":
          switch (args.stauts) {
            case 1:
              filter.push({ expiration_date: null });
              break;
            case 2:
              filter.push({ NOT: [{ expiration_date: null }] });
              break;
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
    }
  }
  const where = { AND: filter };
  const result = await context.prisma.doc_latest.findMany({
    where,
  });

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

  const result = await context.prisma.doc_latest.findMany({
    where,
  });

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
              {case_record_02: { is:{sign_person_id: args.sign_person_id}}}
            ] };
            filter.push(myObj);
            break;
          default:
            myObj[key] = args[key];
            filter.push(myObj);
        }
      }
    }
    
    const where = { AND: filter };
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
    let where={};
    where = {
      chop: { contains: args.chop },
      model: { contains: args.model },
      serial_number: { contains: args.serial_number },
    };

    if(args.type===3 || args.type===4){
      where.type = { in: [args.type, 5] };
    }else{
      where.type = args.type;
    }

    const result = await context.prisma.item_base.findMany({
      where,
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
    const where = {
      name: {
        contains: args.name,
      },
      cus_org: {
        name: {
          contains: args.org_name,
        },
        tax_id: {
          contains: args.org_taxid,
        },
      },
    };
    const result = await context.prisma.cus.findMany({
      where,
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
async function getAllEmp(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.employee.findMany();}
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
async function getAllGcpLatest(parent, args, context) {
  if (chkUserId(context)){
  let filter = [];
  for (let key in args) {
    if (args[key]) {
      let myObj = new Object();
      myObj[key] = args[key];
      filter.push(myObj);
    }
  }
  const where = { AND: filter };
  const result = await context.prisma.doc_latest.findMany({
    where,
  });
  return result;}
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

export default {
  checktoken,
  allusers,
  getUserById,
  getUserByName,
  getNowUser,
  getAllDoc,
  getAllDocLatest,
  getDocHistory,
  getDocChild,
  getDocbyID,
  getAllDocType,
  getAllCase,
  getCasebyID,
  getCaseStatus,
  getCaseCalType,
  getAllItem,
  getItemByID,
  getAllItemType,
  getAllRecord01,
  getAllCust,
  getCustById,
  getAllOrg,
  getOrgById,
  getAllEmp,
  getEmpById,
  getEmpByRole,
  getEmpowerByPerson,
  getTrainByPerson,
  getAllPrj,
  getPrjById,
  getGcpRecordsByPrj,
  getEqptByPrj,
  getAllGcpLatest,
  getGcpById,
  getGcpRecordsByGCPId,
  getGcpRecordById,
  getAllContact,
  getContactById,
  getGCPsByContact,
};
