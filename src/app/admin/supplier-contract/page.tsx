
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CompanyInfoContext } from '@/context/company-info-context';
import { useToast } from '@/hooks/use-toast';

const contractSchema = z.object({
  supplierName: z.string().min(1, 'Supplier Name is required.'),
  supplierAddress: z.string().min(1, "Supplier Address is required."),
  supplierRepresentative: z.string().min(1, 'Representative Name is required.'),
  productDescription: z.string().min(1, 'Product Description is required.'),
  productPrice: z.string().min(1, 'Price is required.'),
  paymentTerms: z.string().min(1, 'Payment Terms are required.'),
  deliveryLeadTime: z.string().min(1, 'Delivery Lead Time is required.'),
  qualityControl: z.string().min(1, 'Quality Control terms are required.'),
  contractDate: z.date(),
});

type ContractValues = z.infer<typeof contractSchema>;

export default function SupplierContractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const companyInfoContext = useContext(CompanyInfoContext);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
    }
  }, [router]);

  const form = useForm<ContractValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      supplierName: '',
      supplierAddress: '',
      supplierRepresentative: '',
      productDescription: '',
      productPrice: '',
      paymentTerms: '30% T/T upon order confirmation, 70% T/T balance before shipment after successful inspection.',
      deliveryLeadTime: '30-45 days after receipt of the initial payment.',
      qualityControl: 'Final inspection based on AQL Level II, Major 2.5, Minor 4.0.',
      contractDate: new Date(),
    },
  });

  const watchedValues = form.watch();
  const { companyInfo } = companyInfoContext || {};

  const handlePrint = () => {
    window.print();
  };
  
  if (!companyInfoContext) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }
  
  const paymentTermsChinese = watchedValues.paymentTerms === '30% T/T upon order confirmation, 70% T/T balance before shipment after successful inspection.' 
    ? '订单确认后支付30% T/T定金，检验合格后出货前付清70% T/T余款。' 
    : '';
  
  const qualityControlChinese = watchedValues.qualityControl === 'Final inspection based on AQL Level II, Major 2.5, Minor 4.0.'
    ? '根据AQL II级标准进行最终检验，主缺陷2.5，次缺陷4.0。'
    : '';

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-3xl font-bold">Supplier Contract Generator</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 no-print">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Contract Information</h3>
            <Form {...form}>
              <form className="space-y-4">
                <FormField control={form.control} name="supplierName" render={({ field }) => (
                  <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="supplierAddress" render={({ field }) => (
                  <FormItem><FormLabel>Supplier Address</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="supplierRepresentative" render={({ field }) => (
                  <FormItem><FormLabel>Legal Representative</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Separator />
                <FormField control={form.control} name="productDescription" render={({ field }) => (
                  <FormItem><FormLabel>Product Description</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="productPrice" render={({ field }) => (
                  <FormItem><FormLabel>Price and Currency</FormLabel><FormControl><Input placeholder="e.g., 15,000 USD" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="deliveryLeadTime" render={({ field }) => (
                  <FormItem><FormLabel>Delivery Lead Time</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="qualityControl" render={({ field }) => (
                  <FormItem><FormLabel>Quality Control</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <div className="print-content">
                <Card>
                  <CardContent className="p-8 font-sans leading-relaxed text-sm">
                      <div className="text-center mb-6">
                          <h2 className="text-lg font-bold">SUPPLIER PROCUREMENT AGREEMENT</h2>
                          <p className="font-bold">采购协议</p>
                      </div>

                      <p className="mb-4">BETWEEN: <br/> 双方：</p>

                      <div className="mb-4">
                          <p className="font-bold">1. THE CLIENT:</p>
                          <p className="font-bold">1. 客户：</p>
                          <p>{companyInfo?.name || '[Your Company Name]'}</p>
                          <p>Address: {companyInfo?.address || '[Your Company Address]'}</p>
                          <p>地址：{companyInfo?.address || '[您的公司地址]'}</p>
                          <p>Represented by: [Your Name], in their capacity as [Your Title].</p>
                          <p>代表人：[您的姓名]，职位：[您的职位]。</p>
                          <p>Hereinafter referred to as "the Client".</p>
                          <p>以下简称“客户”。</p>
                      </div>

                      <p className="text-center my-2">AND <br/>和</p>

                      <div className="mb-4">
                          <p className="font-bold">2. THE SUPPLIER:</p>
                          <p className="font-bold">2. 供应商：</p>
                          <p>{watchedValues.supplierName || '[Supplier Name]'}</p>
                          <p>Address: {watchedValues.supplierAddress || '[Supplier Address]'}</p>
                          <p>地址：{watchedValues.supplierAddress || '[供应商地址]'}</p>
                          <p>Represented by: {watchedValues.supplierRepresentative || '[Supplier Representative Name]'}, in their capacity as [Representative Title].</p>
                          <p>代表人：{watchedValues.supplierRepresentative || '[供应商代表姓名]'}，职位：[代表职位]。</p>
                          <p>Hereinafter referred to as "the Supplier".</p>
                          <p>以下简称“供应商”。</p>
                      </div>
                      
                      <p className="mb-4">Hereinafter collectively referred to as "the Parties".<br/>以下合称“双方”。</p>
                      <p className="mb-6">IT IS AGREED AS FOLLOWS:<br/>经友好协商，达成如下协议：</p>

                      <div className="space-y-4">
                          <div>
                              <h3 className="font-bold">ARTICLE 1: PURPOSE OF THE AGREEMENT</h3>
                              <h3 className="font-bold">第一条：合同目的</h3>
                              <p>This Agreement sets forth the terms and conditions under which the Supplier agrees to manufacture and sell to the Client the products described below.</p>
                              <p>本协议旨在规定供应商为客户生产和销售下述产品的条款和条件。</p>
                          </div>
                           <div>
                              <h3 className="font-bold">ARTICLE 2: PRODUCT DESCRIPTION</h3>
                              <h3 className="font-bold">第二条：产品描述</h3>
                              <p>Description: {watchedValues.productDescription || '[Detailed product description, SKUs, materials, colors, etc.]'}</p>
                              <p>描述：{watchedValues.productDescription || '[详细产品描述、SKU、材料、颜色等]'}</p>
                          </div>
                          <div>
                              <h3 className="font-bold">ARTICLE 3: PRICE</h3>
                              <h3 className="font-bold">第三条：价格</h3>
                              <p>The price for the products is set at: {watchedValues.productPrice || '[Unit and total price, currency (e.g., 10,000 USD)]'}.</p>
                              <p>产品价格定为：{watchedValues.productPrice || '[单价和总价，货币（例如：10,000美元）]'}。</p>
                              <p>This price is understood as FOB (Free On Board) [Chinese Port, e.g., Shanghai], Incoterms 2020, unless otherwise agreed in writing by the Parties.</p>
                              <p>除非双方另有书面约定，此价格为FOB（船上交货）[中国港口，如：上海]，《2020年国际贸易术语解释通则》。</p>
                          </div>
                          <div>
                              <h3 className="font-bold">ARTICLE 4: PAYMENT TERMS</h3>
                              <h3 className="font-bold">第四条：付款条件</h3>
                              <p>The payment terms are as follows:</p>
                              <p>付款条件如下：</p>
                              <p>{watchedValues.paymentTerms}</p>
                              <p>{paymentTermsChinese}</p>
                          </div>
                           <div>
                              <h3 className="font-bold">ARTICLE 5: DELIVERY LEAD TIME</h3>
                              <h3 className="font-bold">第五条：交货时间</h3>
                              <p>The delivery lead time is: {watchedValues.deliveryLeadTime}. This period starts from the date of the Supplier's actual receipt of the initial down payment.</p>
                              <p>交货周期为：{watchedValues.deliveryLeadTime}。该周期自供应商实际收到首付款之日起计算。</p>
                              <p>In case of delay in delivery, the Supplier shall be liable for a penalty of 1% of the total order value per day of delay, capped at 10% of the total order value.</p>
                              <p>如果延迟交货，供应商应支付每日订单总额1%的罚款，罚款上限为订单总额的10%。</p>
                          </div>
                          <div>
                              <h3 className="font-bold">ARTICLE 6: QUALITY CONTROL</h3>
                              <h3 className="font-bold">第六条：质量控制</h3>
                              <p>The quality control procedures are as follows:</p>
                              <p>质量控制程序如下：</p>
                              <p>{watchedValues.qualityControl}. The Client reserves the right to appoint a third party to conduct this inspection. In case of major non-conformity, the Supplier undertakes to rework and correct the production at its own expense.</p>
                              <p>{qualityControlChinese} 客户保留委托第三方进行检验的权利。如发现重大不符，供应商承诺自费返工并修正。</p>
                          </div>
                          <div>
                              <h3 className="font-bold">ARTICLE 7: SUPPLIER'S OBLIGATIONS</h3>
                              <h3 className="font-bold">第七条：供应商的义务</h3>
                              <ul className="list-disc pl-5">
                                  <li>To deliver products that conform to the agreed specifications and quality standards.<br/>交付符合约定规格和质量标准的产品。</li>
                                  <li>To respect the delivery lead times.<br/>遵守交货时间。</li>
                                  <li>To provide all necessary documentation for exportation.<br/>提供出口所需的所有文件。</li>
                              </ul>
                          </div>
                           <div>
                              <h3 className="font-bold">ARTICLE 8: CLIENT'S OBLIGATIONS</h3>
                              <h3 className="font-bold">第八条：客户的义务</h3>
                              <ul className="list-disc pl-5">
                                  <li>To make payments according to the agreed schedule.<br/>按照约定的时间表付款。</li>
                                  <li>To approve or reject samples and inspection reports within a reasonable timeframe.<br/>在合理的时间内确认或拒绝样品及检验报告。</li>
                              </ul>
                          </div>
                          <div>
                              <h3 className="font-bold">ARTICLE 9: CONFIDENTIALITY</h3>
                              <h3 className="font-bold">第九条：保密条款</h3>
                              <p>The Parties agree not to disclose any confidential information exchanged within the framework of this agreement.</p>
                              <p>双方同意不泄露在本协议框架内交换的任何机密信息。</p>
                          </div>
                           <div>
                              <h3 className="font-bold">ARTICLE 10: GOVERNING LAW AND JURISDICTION</h3>
                              <h3 className="font-bold">第十条：适用法律与管辖权</h3>
                              <p>This Agreement shall be governed by the law of [e.g., China/France]. Any dispute relating to its execution shall be submitted to the exclusive jurisdiction of the competent court of [Your City] or to arbitration in [Place of Arbitration, e.g., CIETAC in Shanghai].</p>
                              <p>本协议受[例如：中国/法国]法律管辖。任何与本协议执行相关的争议应提交至[您的城市]有管辖权的法院或在[仲裁地，如：上海CIETAC]进行仲裁。</p>
                          </div>
                      </div>

                      <div className="signature-block mt-10">
                          <p>Done in __________, on {format(watchedValues.contractDate, 'MMMM d, yyyy', { locale: enUS })}.</p>
                          <p>签订于 __________，日期为 {format(watchedValues.contractDate, 'yyyy年MM月dd日')}。</p>
                          <p className="mt-4">In two original copies, one for each Party.</p>
                          <p>本合同一式两份，双方各执一份。</p>

                          <div className="grid grid-cols-2 gap-8 mt-12">
                              <div>
                                  <p>For the Client (客户方):</p>
                                  <p className="mt-2">[Signature / 签名]</p>
                                  <div className="border-b border-black mt-16"></div>
                                  <p>{companyInfo?.name || '[Your Name]'}</p>
                                  <p>[Your Title / 职位]</p>
                              </div>
                              <div>
                                  <p>For the Supplier (供应商方):</p>
                                  <p className="mt-2">[Signature / 签名]</p>
                                  <div className="border-b border-black mt-16"></div>
                                  <p>{watchedValues.supplierRepresentative || '[Supplier Representative Name]'}</p>
                                  <p>[Representative Title / 代表职位]</p>
                              </div>
                          </div>
                      </div>
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
