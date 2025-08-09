import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CodeGenerator } from './codeGenerator';
import {
	SendSmtpEmail,
	TransactionalEmailsApi,
	TransactionalEmailsApiApiKeys
} from '@getbrevo/brevo';
import { BREVO_API_KEY } from '$env/static/private';

export class User {
	private email: string;
	private code: number;
	private token: string;
	private db: any;

	constructor(email: string, db: any) {
		this.email = email;
		this.code = CodeGenerator.getCode(); // Generate a 6-digit code
		this.token = CodeGenerator.getToken(); // Generate a token
		this.db = db;
	}

	/**
	 * Creates a new user entry in the database with a random 6-digit code.
	 * First and last login dates are set to null.
	 */
	async create(): Promise<void> {
		try {
			await this.db
				.insert(users)
				.values({ email: this.email, code: this.code })
				.onConflictDoNothing();
		} catch (error) {
			console.error('Error creating user:', error);
			throw error;
		}
	}

	/**
	 * Retrieves user data from the database by email.
	 */
	async get(): Promise<{
		id: number;
		email: string;
		code: number;
		firstLoginDate: Date | null;
		lastLoginDate: Date | null;
	} | null> {
		try {
			const result = await this.db.select().from(users).where(eq(users.email, this.email)).limit(1);
			return result[0] ?? null;
		} catch (error) {
			console.error('Error fetching user:', error);
			throw error;
		}
	}

	/**
	 * Retrieves the verification code for the user.
	 */
	getCode(): number {
		return this.code;
	}

	/**
	 * Retrieves the token code for the user.
	 */
	getToken(): string {
		return this.token;
	}

	/**
	 * Sets a new verification code for the user and updates it in the database.
	 * @param code The new verification code to set.
	 */
	async setCode(code: number): Promise<void> {
		this.code = code;
		try {
			await this.db.update(users).set({ code: this.code }).where(eq(users.email, this.email));
		} catch (error) {
			console.error('Error updating user code:', error);
			throw error;
		}
	}

	/**
	 * Sends a verification email to the user using Sendinblue API.
	 * @param apiKey The API key for Sendinblue.
	 */
	async sendVerificationEmail(apiKey: string): Promise<void> {
		const defaultClient = new TransactionalEmailsApi();
		defaultClient.setApiKey(TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY ?? '');

		const sendSmtpEmail = new SendSmtpEmail();
		sendSmtpEmail.sender = { email: 'alright2save@gmail.com', name: 'Block Bootstrap' };
		sendSmtpEmail.to = [{ email: this.email }];
		sendSmtpEmail.templateId = 1;
		sendSmtpEmail.params = { CODE: this.code.toString() };

		try {
			const data = await defaultClient.sendTransacEmail(sendSmtpEmail);
			//console.log('API called successfully. Returned data: ' + JSON.stringify(data));
		} catch (error) {
			//console.error('Error sending verification email:', JSON.stringify(error));
			throw error;
		}
	}
}
