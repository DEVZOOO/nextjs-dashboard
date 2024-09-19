'use server';   // export시킨 메소드 전부를 server action 처리함

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),  // validate시에 number 타입으로 강제함
    status: z.enum(['pending', 'paid']),
    data: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, data: true, });

/**
 * invoice 생성
 * @param formData input data
 */
export async function createInvoice(formData: FormData) {
    // const rawFormData = Object.fromEntries(formData.entries());
    /*
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    console.log(rawFormData);
    */

    // type
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100; // dollar > cent
    const date = new Date().toISOString().split('T')[0];    // '2024-09-19T11:46:33'

    await sql`
INSERT INTO invoices
(customer_id, amount, status, date)
VALUES (
    ${customerId},
    ${amountInCents},
    ${status},
    ${date}
)
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

