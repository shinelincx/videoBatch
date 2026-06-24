package com.lu.admin.common.constant;

/**
 * @Description 描述
 * @Date 2018/8/11 下午3:15
 */
public class BizConstants {


    /**
     * 0 表示该用户处于禁用状???（???状态???的用户不能允许登陆），
     * 1 表示正常登陆状态。
     */
    public final static Integer USER_STATUS_FORBIDDEN = 0;
    public final static Integer USER_STATUS_NORMAL = 1;

    /**
     * -1 已删除，0 封禁，1 正常。
     */
    public final static Integer GROUP_STATUS_DELETED = -1;
    public final static Integer GROUP_STATUS_FORBIDDEN = 0;
    public final static Integer GROUP_STATUS_NORMAL = 1;

    // 提现状态（1：待审核，2：提现成功，3：审核不通过）
    public static final int WITHDRAW_STATUS_1 = 1;
    public static final int WITHDRAW_STATUS_2 = 2;
    public static final int WITHDRAW_STATUS_3 = 3;

    /** 余额流水类型（0: 充值，1：收入，2：支出，3：平台赠送，4: 提现，5：后台）*/
    public static final int USER_BALANCE_FLOW_TYPE_RECHARGE= 0;
    public static final int USER_BALANCE_FLOW_TYPE_IN = 1;
    public static final int USER_BALANCE_FLOW_TYPE_OUT = 2;
    public static final int USER_BALANCE_FLOW_TYPE_PRESENT = 3;
    public static final int USER_BALANCE_FLOW_TYPE_WITHDRAW = 4;
    public static final int USER_BALANCE_FLOW_TYPE_MANAGE = 5;

    /** 红包状态（0：未抢到，1：已抢到）*/
    public static final int RES_ENVELOPE_STATUS_NOT_GOT = 0;
    public static final int RES_ENVELOPE_STATUS_GOT = 1;

    /** 充值申请状态（ 1通过 0待审核 2拒绝）*/
    public static final String RECHARGEAPPLY_STATUS_0 = "0";
    public static final String RECHARGEAPPLY_STATUES_1 = "1";
    public static final String RECHARGEAPPLY_STATUS_2 = "2";
}
