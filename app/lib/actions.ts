'use server';   // export시킨 메소드 전부를 server action 처리함

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number()  // validate시에 number 타입으로 강제함
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    data: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, data: true, });
const UpdateInvoice = FormSchema.omit({ id: true, data: true, });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

/**
 * invoice 생성
 * @param prevState useActionState의 state
 * @param formData input data
 */
export async function createInvoice(prevState: State, formData: FormData) {
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
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount * 100; // dollar > cent
    const date = new Date().toISOString().split('T')[0];    // '2024-09-19T11:46:33'

    try {
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
    } catch (e) {
        return {
            message: 'Database Error: Failed to create invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

/**
 * invoice 수정
 * @param id 수정할 invoice id
 * @param formData 수정 input data
 */
export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Missing Fields.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId},
            amount = ${amountInCents},
            status = ${status}
        WHERE id = ${id}
            `;

    } catch (e) {
        console.log(e);
        return {
            message: 'Database Error: Failed to update invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

/**
 * invoice 삭제
 * @param id 삭제할 invoice id
 */
export async function deleteInvoice(id: string) {
    // throw new Error('fail to delete!');

    try {
        await sql`
        DELETE FROM invoices
        WHERE id = ${id}
            `;
    } catch (e) {
        console.log(e);
        return { message: 'Database Error: Failed to Delete Invoice' };
    }

    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice' };
}

/**
 * 인증
 * @param prevState 
 * @param formData 
 * @returns 
 */
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }

        throw error;
    }
}
