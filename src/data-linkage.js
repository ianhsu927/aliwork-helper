/**
 * 数据联动相关方法 <br/>
 * 功能上类似于宜搭表单的数据联动，即根据本表单数据作为条件从其他表单带数据到本表单
 * @module DataLinkage
 */

import { searchFormDatasAll } from "./data-source";

/**
 * 条件规则映射项 ConditionMapItem
 * @typedef {Object} ConditionMapItem
 * @property {string} from 本表单字段的唯一标识，查询条件的值来源于此字段
 * @property {string} to 目标表单字段唯一标识，使用此字段作为筛选字段
 * @property {boolean} isSubform from字段是否子表字段
 */

/**
 * 处理数据联动的条件规则映射
 * @param {Object} context this上下文
 * @param {Array<ConditionMapItem>} conditionMap 条件规则映射
 * @param {string} tableFieldId 子表唯一标识
 * @param {number} changeItemIndex 子表字段所在行下标
 *
 * @returns {Object} 用于查询目标表单的条件参数
 */
function resolveConditionMap(context, conditionMap, tableFieldId, changeItemIndex) {
  const searchParams = {};

  if (!Array.isArray(conditionMap)) {
    return searchParams;
  }
  if (tableFieldId && changeItemIndex === undefined) {
    console.warn("[resolveConditionMap]: 传入了子表唯一标识时必须传入子表行下标");
  }

  let subformData = {};
  const containSubformField = conditionMap.some((item) => item.isSubform);
  if (containSubformField) {
    subformData = context.$(tableFieldId).getValue()[changeItemIndex];
  }
  for (const condition of conditionMap) {
    let value;
    if (condition.isSubform) {
      value = subformData[condition.from];
    } else {
      value = context.$(condition.from).getValue();
    }

    if (condition.from.startsWith("departmentSelectField")) {
      const dpt = (value || [])[0];
      value = (dpt || {}).value;
    }
    if (condition.from.startsWith("employeeField")) {
      if (!Array.isArray(value)) {
        value = [value];
      }
      const employee = value[0];
      value = (employee || {}).value;
    }

    searchParams[condition.to] = value;
  }

  return searchParams;
}

/**
 * 数据联动后置处理函数定义
 * @callback PostProcessor
 * @param {Object} context this上下文
 * @param {any} value 从目标表单获取到的原始值
 * @return {*} 处理后的值
 */

/**
 * 数据联动 <br/>
 * 本方法仅支持带数据到主表，要数据联动到子表，请使用{@link module:DataLinkage.dataLinkageSubform}
 * @static
 * @param {Object} context this上下文
 * @param {"form" | "process"} targetFormType 目标表单类型，form表示普通表单，process表示流程
 * @param {string} targetFormUuid 目标表单UUID
 * @param {string} targetFieldId 目标表单要带过来的字段唯一标识
 * @param {string} fillingFieldId 要填充的本表单字段唯一标识
 * @param {Array<module:DataLinkage~ConditionMapItem>} conditionMap 条件规则映射
 * @param {module:DataLinkage~PostProcessor} postProcessor 后置处理函数
 * @param {boolean} stirctCondition 严格的条件规则，即只要有一个条件为undefined、null或者空字符串，则填充值为空
 *
 * @example
 * // 假设我们有一个员工信息表A（FORM-aaa）和审批表B（FORM-bbb）
 * // 员工信息表中有两个字段：员工姓名（textField_aaa1） 和 主管（textField_aaa2）
 * // 审批表有一个申请人字段，唯一标识textField_bbb1，和 主管（textField_bbb2）。
 * // 现在，在审批表中我们需要根据申请人从员工信息表中带出主管信息（textField_aaa2）并填充到主管（textField_bbb2）字段
 * // 在审批表中可以这么写：
 *
 * // 当申请人变更时执行，需要将此函数设置为申请人的值变更动作回调
 * export function onProposerChange() {
 *   dataLinkage(
 *     this,
 *     "form",
 *     "FORM-aaa",
 *     "textField_aaa2",
 *     "textField_bbb2",
 *     [{ from: "textField_bbb1", to: "textField_aaa1" }],
 *     undefined,
 *     true
 *   );
 * }
 */
async function dataLinkage(
  context,
  targetFormType,
  targetFormUuid,
  targetFieldId,
  fillingFieldId,
  conditionMap,
  postProcessor,
  stirctCondition = true
) {
  if (!targetFormUuid || !targetFieldId || !fillingFieldId) {
    return;
  }

  // 1.组装查询参数
  let searchParams = {};
  if (Array.isArray(conditionMap)) {
    searchParams = resolveConditionMap(context, conditionMap);
  }

  // 2.查询目标表单获取关联字段值
  let fillValue = undefined;
  const containEmptyParam = Object.values(searchParams).some(
    (value) => value === undefined || value === null || value === ""
  );
  if (!(stirctCondition && containEmptyParam)) {
    let formDatas = await searchFormDatasAll(
      context,
      targetFormType,
      targetFormUuid,
      searchParams,
      { strictQuery: true }
    );
    if (formDatas.length) {
      const formData = formDatas[0];
      fillValue = formData[targetFieldId];
    }
  }

  if (postProcessor instanceof Function) {
    fillValue = postProcessor(context, fillValue);
  }

  // 3.将关联字段值填充到本表单字段
  context.$(fillingFieldId).getProps().onChange({ value: fillValue });

  console.log(
    `[子表数据联动]填充字段: ${fillingFieldId} 填充值: ${fillValue} 严格查询: ${stirctCondition} 查询参数: `,
    searchParams
  );
}

/**
 * 子表数据联动
 * @static
 * @param {Object} context this上下文
 * @param {string} tableFieldId 子表唯一标识
 * @param {string} formGroupId 子表数据行标识
 * @param {"form" | "process"} targetFormType 目标表单类型，form表示普通表单，process表示流程
 * @param {string} targetFormUuid 目标表单UUID
 * @param {string} targetFieldId 目标表单要带过来的字段唯一标识
 * @param {string} fillingFieldId 要填充的本表单字段唯一标识
 * @param {Array<module:DataLinkage~ConditionMapItem>} conditionMap 条件规则映射
 * @param {module:DataLinkage~PostProcessor} postProcessor 后置处理函数
 * @param {boolean} stirctCondition 严格的条件规则，即只要有一个条件为undefined、null或者空字符串，则填充值为空
 *
 * @example
 * // 假设我们有一个员工信息表A（FORM-aaa）和审批表B（FORM-bbb）
 * // 员工信息表中有两个字段：员工姓名（textField_aaa1） 和 主管（textField_aaa2）
 * // 审批表有一个子表（tableField_bbb），子表中包含两个字段：1.员工姓名字段，唯一标识textField_bbb1，和 2.主管（textField_bbb2）。
 * // 现在，在审批表的子表中我们需要根据员工姓名从员工信息表中带出主管信息（textField_aaa2）并填充到主管（textField_bbb2）字段
 * // 在审批表中可以这么写：
 *
 * // 当子表变更时执行，需要将此函数设置为子表的值变更动作回调
 * export function onSubformChange({ extra }) {
 *   if (extra && extra.from === "form_change") {
 *     const { formGroupId, tableFieldId } = extra;
 *
 *     if (extra.fieldId === "textField_bbb1") {
 *       dataLinkageSubform(
 *         this,
 *         "tableField_bbb",
 *         formGroupId,
 *         "form",
 *         "FORM-aaa",
 *         "textField_aaa2",
 *         "textField_bbb2",
 *         [{ from: "textField_bbb1", to: "textField_aaa1", isSubform: true }],
 *         undefined,
 *         true
 *       );
 *     }
 *   }
 * }
 */
async function dataLinkageSubform(
  context,
  tableFieldId,
  formGroupId,
  targetFormType,
  targetFormUuid,
  targetFieldId,
  fillingFieldId,
  conditionMap,
  postProcessor,
  stirctCondition = true
) {
  if (!tableFieldId || !targetFormUuid || !targetFieldId || !fillingFieldId) {
    return;
  }

  // 1.组装查询参数
  const changeItemIndex = (context.$(tableFieldId).getItems() || []).indexOf(formGroupId);
  let searchParams = {};
  if (Array.isArray(conditionMap)) {
    searchParams = resolveConditionMap(
      context,
      conditionMap,
      tableFieldId,
      changeItemIndex
    );
  }

  // 2.查询目标表单获取关联字段值
  let fillValue = undefined;
  const containEmptyParam = Object.values(searchParams).some(
    (value) => value === undefined || value === null || value === ""
  );
  if (!(stirctCondition && containEmptyParam)) {
    let formDatas = await searchFormDatasAll(
      context,
      targetFormType,
      targetFormUuid,
      searchParams,
      { strictQuery: true }
    );
    if (formDatas.length) {
      const formData = formDatas[0];
      fillValue = formData[targetFieldId];
    }
  }

  if (postProcessor instanceof Function) {
    fillValue = postProcessor(context, fillValue);
  }

  // 3.将关联字段值填充到本表单字段
  const subformInst = context.$(tableFieldId);
  subformInst.updateItemValue(formGroupId, { [fillingFieldId]: fillValue });

  console.log(
    `[子表数据联动]子表ID: ${tableFieldId}, 填充字段: ${fillingFieldId} 填充值: ${fillValue} 严格查询: ${stirctCondition} 查询参数: `,
    searchParams
  );
}

export { dataLinkage, dataLinkageSubform };
