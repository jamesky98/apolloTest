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
    console.log(args.status);
    if(args.status || args.status===0){
      console.log("has args.status");
      result.map(x=>{
        if(x.gcp_record[0].status===args.status){
          return myarray.push(x);
        }})
    }else{
      console.log("no args.status");
      myarray = result;
    }
    return myarray;
  }
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
  getEmpRoleList,
  getEmpowerbyRole,
  getEmpowerByPerson,
  getTrainByPerson,
  getAllTrain,
  getAllPrj,
  getPrjById,
  getGcpRecordsByPrj,
  getEqptByPrj,
  getAllGcp,
  getGcpType,
  getGcpRecordsByGCPId,
  getGcpRecordById,
  getAllContact,
  getContactById,
  getGCPsByContact,
};
